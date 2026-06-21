import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const publicDir = "public";

function rasterizeSvg(svgPath, width, height) {
  const svg = readFileSync(join(publicDir, svgPath));
  return sharp(svg).resize(width, height).png();
}

async function main() {
  await rasterizeSvg("favicon.svg", 48, 48).toFile(
    join(publicDir, "favicon-48x48.png")
  );
  await rasterizeSvg("logo.svg", 180, 180).toFile(
    join(publicDir, "apple-touch-icon.png")
  );
  await rasterizeSvg("logo.svg", 512, 512).toFile(
    join(publicDir, "logo-512.png")
  );
  await rasterizeSvg("og-image.svg", 1200, 630).toFile(
    join(publicDir, "og-image.png")
  );

  const favicon48 = await rasterizeSvg("favicon.svg", 48, 48).toBuffer();
  const favicon32 = await rasterizeSvg("favicon.svg", 32, 32).toBuffer();
  const favicon16 = await rasterizeSvg("favicon.svg", 16, 16).toBuffer();
  const ico = await toIco([favicon16, favicon32, favicon48]);
  writeFileSync(join(publicDir, "favicon.ico"), ico);

  console.log("generate-seo-assets: wrote PNG favicons, og-image.png, favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
