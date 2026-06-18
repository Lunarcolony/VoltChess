import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const indexPath = join("dist", "index.html");
const fallbackPath = join("dist", "404.html");

if (!existsSync(indexPath)) {
  console.error("postbuild-spa: dist/index.html not found");
  process.exit(1);
}

copyFileSync(indexPath, fallbackPath);
console.log("postbuild-spa: copied index.html → 404.html for SPA deep links");
