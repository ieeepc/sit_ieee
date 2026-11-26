import { google } from "googleapis";
import { Readable } from "node:stream";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

type ServiceAccount = { client_email?: string; private_key?: string };
type OAuthCredentials = { clientId: string; clientSecret: string; refreshToken: string };

function looksReal(value: string) {
  return !/dummy|replace|your[-_]/i.test(value);
}

function readCredentials(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ServiceAccount;
      if (parsed.client_email && parsed.private_key) return parsed;
    } catch {
      // fall through to the split variables
    }
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.GOOGLE_PRIVATE_KEY?.trim();
  if (email && key && looksReal(email) && key.includes("BEGIN PRIVATE KEY")) {
    return { client_email: email, private_key: key.replace(/\\n/g, "\n") };
  }
  return null;
}

// OAuth refresh token for the chapter's own Google account. Preferred over a service
// account because service accounts cannot own files in a personal (non-Workspace) Drive.
function readOAuth(): OAuthCredentials | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) return null;
  if (!looksReal(clientId) || !looksReal(clientSecret) || !looksReal(refreshToken)) return null;
  return { clientId, clientSecret, refreshToken };
}

function driveFolderId() {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  return folderId && looksReal(folderId) ? folderId : null;
}

export function isDriveConfigured() {
  return Boolean(driveFolderId() && (readOAuth() || readCredentials()));
}

export function driveRootFolderId() {
  return driveFolderId();
}

function driveClient() {
  const oauth = readOAuth();
  if (oauth) {
    const auth = new google.auth.OAuth2(oauth.clientId, oauth.clientSecret);
    auth.setCredentials({ refresh_token: oauth.refreshToken });
    return google.drive({ version: "v3", auth });
  }
  const credentials = readCredentials();
  if (credentials) {
    const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
    return google.drive({ version: "v3", auth });
  }
  throw new Error("Google Drive credentials are not configured.");
}

function escapeDriveQuery(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export type StoredAbstract = {
  url: string;
  publicId: string;
  resourceType: "raw" | "image";
};

export async function ensureDriveFolder(name: string, parentId: string): Promise<string> {
  const drive = driveClient();
  const found = await drive.files.list({
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${escapeDriveQuery(name)}' and '${parentId}' in parents and trashed = false`,
    fields: "files(id)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const existing = found.data.files?.[0]?.id;
  if (existing) return existing;

  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
    supportsAllDrives: true,
  });
  const id = created.data.id;
  if (!id) throw new Error("Google Drive did not return a folder id.");
  return id;
}

export async function writeDriveJson(
  folderId: string,
  name: string,
  data: unknown,
  existingFileId?: string | null
): Promise<string> {
  const drive = driveClient();
  const body = Buffer.from(JSON.stringify(data, null, 2), "utf8");
  const media = { mimeType: "application/json", body: Readable.from(body) };

  const found = existingFileId
    ? null
    : await drive.files.list({
        q: `name = '${escapeDriveQuery(name)}' and '${folderId}' in parents and trashed = false`,
        fields: "files(id)",
        pageSize: 1,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
  const fileId = existingFileId ?? found?.data.files?.[0]?.id;

  if (fileId) {
    await drive.files.update({ fileId, media, supportsAllDrives: true });
    return fileId;
  }

  const created = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media,
    fields: "id",
    supportsAllDrives: true,
  });
  const id = created.data.id;
  if (!id) throw new Error("Google Drive did not return a file id.");
  return id;
}

export async function uploadAbstractToDrive(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  parentFolderId?: string | null
): Promise<StoredAbstract> {
  const folderId = parentFolderId || driveRootFolderId();
  if (!folderId) throw new Error("Google Drive folder is not configured.");
  const drive = driveClient();

  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: mimeType || "application/pdf", body: Readable.from(buffer) },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const fileId = created.data.id;
  if (!fileId) throw new Error("Google Drive did not return a file id.");

  // Best effort: makes the link viewable without the organisation login.
  await drive.permissions
    .create({ fileId, requestBody: { role: "reader", type: "anyone" }, supportsAllDrives: true })
    .catch(() => {});

  return {
    url: created.data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    publicId: `drive:${fileId}`,
    resourceType: "raw",
  };
}

export async function deleteDriveFile(fileId: string) {
  await driveClient().files.delete({ fileId, supportsAllDrives: true });
}

export function driveDownloadUrl(fileId: string) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
