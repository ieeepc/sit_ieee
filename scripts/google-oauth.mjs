import http from "node:http";
import { existsSync } from "node:fs";
import { google } from "googleapis";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
if (!clientId || !clientSecret || /dummy|replace|your[-_]/i.test(clientId)) {
  console.error("Set real GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.local first.");
  process.exit(1);
}

const port = 53682;
const redirectUri = `http://localhost:${port}`;
const auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const url = auth.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive"],
});

const timeout = setTimeout(() => {
  console.error("Timed out after 10 minutes. Run the script again.");
  process.exit(1);
}, 10 * 60 * 1000);

const server = http.createServer(async (req, res) => {
  try {
    const callback = new URL(req.url, redirectUri);
    const code = callback.searchParams.get("code");
    if (!code) {
      res.writeHead(400, { "Content-Type": "text/plain" }).end("No authorisation code in the callback.");
      return;
    }
    const { tokens } = await auth.getToken(code);
    res
      .writeHead(200, { "Content-Type": "text/plain" })
      .end("Authorised. You can close this tab and return to the terminal.");
    if (!tokens.refresh_token) {
      console.error("No refresh token returned. Revoke the app's access in your Google account, then run the script again.");
      return;
    }
    console.log("\nRefresh token:\n\n" + tokens.refresh_token + "\n");
    console.log("Add it to .env.local as GOOGLE_OAUTH_REFRESH_TOKEN and restart the dev server.");
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" }).end("Authorisation failed.");
    console.error(err);
  } finally {
    clearTimeout(timeout);
    server.close();
  }
});

server.listen(port, () => {
  console.log("1. Open this URL in a browser already signed in as the chapter's Google account:\n");
  console.log(url + "\n");
  console.log("2. Approve access (click Advanced -> Go to app if Google warns it is unverified).");
  console.log("3. The refresh token will be printed here.");
});
