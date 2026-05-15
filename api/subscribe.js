import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { google } from "googleapis";

/* Vercel deployments inject env from the dashboard — .env.local is gitignored and never uploaded.
   Local `vercel dev` does not always hydrate process.env from .env.local for Node handlers. */
if (!process.env.VERCEL) {
  loadEnv({ path: resolve(process.cwd(), ".env") });
  loadEnv({ path: resolve(process.cwd(), ".env.local") });
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(request, response) {
  try {
    if (request.method !== "POST") {
      return response.status(405).json({ ok: false, error: "Method not allowed" });
    }

    let body = request.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body || "{}");
      } catch {
        body = {};
      }
    }

    const { email, source = "landing_page", website = "" } = body || {};

    // Honeypot anti-spam field
    if (website) {
      return response.status(200).json({ ok: true });
    }

    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!emailRegex.test(cleanEmail)) {
      return response.status(400).json({ ok: false, error: "Invalid email" });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          cleanEmail,
          new Date().toISOString(),
          source,
          request.headers["user-agent"] || ""
        ]],
      },
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return response.status(500).json({ ok: false, error: "Server error" });
  }
}
