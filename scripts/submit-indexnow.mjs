import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  INDEXNOW_KEY,
  SITE_HOST,
  SITE_URL,
  getPublicUrls,
  indexNowKeyUrl,
} from "./seo-urls.mjs";

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

async function verifyKeyFile(keyUrl) {
  const res = await fetch(keyUrl, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Key file not reachable (${res.status}): ${keyUrl}`);
  }
  const body = (await res.text()).trim();
  if (body !== INDEXNOW_KEY) {
    throw new Error(
      `Key file content mismatch at ${keyUrl} — expected "${INDEXNOW_KEY}", got "${body}"`
    );
  }
}

async function submitToEndpoint(endpoint, payload) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`submit-indexnow: ${endpoint} → ${res.status} OK`);
    return true;
  }

  const text = await res.text();
  console.warn(
    `submit-indexnow: ${endpoint} → ${res.status} ${text || res.statusText}`
  );
  return false;
}

async function main() {
  const key = process.env.INDEXNOW_KEY?.trim() || INDEXNOW_KEY;
  const keyPath = join("public", `${key}.txt`);
  if (!existsSync(keyPath)) {
    console.error(`submit-indexnow: missing ${keyPath}`);
    process.exit(1);
  }

  const onDisk = readFileSync(keyPath, "utf8").trim();
  if (onDisk !== key) {
    console.error(`submit-indexnow: ${keyPath} content does not match key`);
    process.exit(1);
  }

  const keyLocation = `${process.env.INDEXNOW_SITE_URL || SITE_URL}/${key}.txt`;
  const skipVerify = process.env.INDEXNOW_SKIP_VERIFY === "true";

  if (!skipVerify) {
    console.log(`submit-indexnow: verifying ${keyLocation}`);
    await verifyKeyFile(keyLocation);
    console.log("submit-indexnow: key file verified");
  }

  const urlList = getPublicUrls();
  const payload = {
    host: SITE_HOST,
    key,
    keyLocation,
    urlList,
  };

  console.log(`submit-indexnow: submitting ${urlList.length} URLs`);

  let ok = false;
  for (const endpoint of INDEXNOW_ENDPOINTS) {
    if (await submitToEndpoint(endpoint, payload)) {
      ok = true;
    }
  }

  if (!ok) {
    console.error("submit-indexnow: all endpoints failed");
    process.exit(1);
  }

  console.log("submit-indexnow: done");
}

main().catch((err) => {
  console.error(err.message || err);
  console.error(
    "\nIf deploy just finished, wait 1–2 minutes and run again.\n" +
      "Or deploy first, then: npm run indexnow"
  );
  process.exit(1);
});
