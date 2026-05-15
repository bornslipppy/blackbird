import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");

/** Do not mutate during `vercel dev` (would dirty the repo). */
const shouldMutate =
  process.env.FORCE_OG_INJECT === "1" ||
  (process.env.VERCEL === "1" && process.env.VERCEL_ENV !== "development");

const rawHost =
  (process.env.SITE_ORIGIN || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL || "").replace(/\/$/, "") ||
  (process.env.VERCEL_URL || "").replace(/\/$/, "");

let html = fs.readFileSync(indexPath, "utf8");

if (!shouldMutate) {
  console.log(
    "inject-og-origin: skipped (local or vercel dev; set FORCE_OG_INJECT=1 to patch manually)"
  );
  process.exit(0);
}

if (!rawHost) {
  console.warn(
    "inject-og-origin: missing SITE_ORIGIN / VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL — OG tags stay as placeholders. On Vercel, enable System Environment Variables (Project → Settings → Environment Variables)."
  );
  process.exit(0);
}

const origin = `https://${rawHost}`;
html = html.replaceAll("__OG_ORIGIN__", origin);
fs.writeFileSync(indexPath, html);
console.log(`inject-og-origin: OG URLs → ${origin}`);
