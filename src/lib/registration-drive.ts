import {
  driveDownloadUrl,
  driveRootFolderId,
  ensureDriveFolder,
  isDriveConfigured,
  writeDriveJson,
} from "./drive";

type DriveMember = {
  name?: string;
  year?: string;
  usn?: string;
  phone?: string;
  email?: string;
};

type DriveAbstract = {
  fileName?: string;
  size?: number;
  url?: string;
  publicId?: string;
  submittedAt?: Date;
};

type SyncableRegistration = {
  _id: unknown;
  name: string;
  phone?: string | null;
  email?: string | null;
  teamName?: string | null;
  collegeName?: string | null;
  domain?: string | null;
  teamSize?: number | null;
  teamMembers?: DriveMember[];
  stage: number;
  abstract?: DriveAbstract | null;
  abstracts?: DriveAbstract[];
  abstractSubmittedAt?: Date | null;
  driveFolderId?: string | null;
  driveJsonFileId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  save: () => Promise<unknown>;
};

function safeFolderName(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "team";
}

// Best-effort mirror of a HACK-Z registration into Drive: one folder per team with a
// registration.json that is rewritten at every stage. Never lets Drive failures block
// the actual registration.
export async function syncRegistrationToDrive(
  registration: SyncableRegistration,
  eventName: string
) {
  if (!isDriveConfigured()) return;
  const rootFolderId = driveRootFolderId();
  if (!rootFolderId) return;

  try {
    const registrationId = String(registration._id);
    if (!registration.driveFolderId) {
      const folderName = safeFolderName(
        `${registration.teamName || registration.name} - ${registrationId.slice(-6)}`
      );
      registration.driveFolderId = await ensureDriveFolder(folderName, rootFolderId);
    }

    const payload = {
      registrationId,
      event: eventName,
      stage: registration.stage,
      team: {
        name: registration.teamName ?? "",
        college: registration.collegeName ?? "",
        domain: registration.domain ?? "",
        size: registration.teamSize ?? registration.teamMembers?.length ?? 0,
      },
      leader: {
        name: registration.name,
        phone: registration.phone ?? "",
        email: registration.email ?? "",
      },
      members: (registration.teamMembers ?? []).map((member) => ({
        name: member.name ?? "",
        year: member.year ?? "",
        usn: member.usn ?? "",
        phone: member.phone ?? "",
        email: member.email ?? "",
      })),
      abstracts: (registration.abstracts?.length
        ? registration.abstracts
        : registration.abstract?.url
          ? [registration.abstract]
          : []
      ).map((entry) => ({
        fileName: entry.fileName ?? "",
        size: entry.size ?? 0,
        url: entry.url ?? "",
        downloadUrl: entry.publicId?.startsWith("drive:")
          ? driveDownloadUrl(entry.publicId.slice("drive:".length))
          : (entry.url ?? ""),
        submittedAt: entry.submittedAt ?? registration.abstractSubmittedAt ?? null,
      })),
      createdAt: registration.createdAt ?? null,
      updatedAt: registration.updatedAt ?? null,
    };

    registration.driveJsonFileId = await writeDriveJson(
      registration.driveFolderId,
      "registration.json",
      payload,
      registration.driveJsonFileId
    );
    await registration.save();
  } catch (err) {
    console.error("Could not mirror the registration to Google Drive.", err);
  }
}
