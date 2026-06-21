import { existsSync } from "node:fs";
import { join } from "node:path";

const required = [
  "favicon.ico",
  "favicon-48x48.png",
  "apple-touch-icon.png",
  "logo-512.png",
  "og-image.png",
];

const missing = required.filter((file) => !existsSync(join("dist", file)));

if (missing.length) {
  console.error(
    "verify-dist-assets: missing from dist/ (favicon URLs will serve the SPA):\n  " +
      missing.join("\n  ")
  );
  process.exit(1);
}

console.log("verify-dist-assets: favicon and og-image assets present in dist/");
