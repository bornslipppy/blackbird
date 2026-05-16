import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pub = path.join(root, "public");

const FILES = ["index.html", "favicon.svg", "og-preview.png"];
const DIRS = ["assets"];

fs.rmSync(pub, { recursive: true, force: true });
fs.mkdirSync(pub, { recursive: true });

for (const name of FILES) {
  const src = path.join(root, name);
  fs.copyFileSync(src, path.join(pub, name));
}

for (const name of DIRS) {
  const src = path.join(root, name);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(pub, name), { recursive: true });
}

console.log("sync-public: copied static assets to public/");
