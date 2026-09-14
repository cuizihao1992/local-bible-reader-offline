import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contract = JSON.parse(readFileSync(join(root, "docs/api-contract.json"), "utf8"));

const sources = {
  node: ["server.js"],
  android: [
    "android/app/src/main/java/local/bible/reader/OfflineApi.java",
    "android/app/src/main/java/local/bible/reader/MainActivity.java",
  ],
  ios: ["ios/LocalBible/OfflineApi.swift"],
};

function extractPaths(text) {
  const paths = new Set();
  const re = /\/api\/[a-zA-Z0-9_./-]+/g;
  let match;
  while ((match = re.exec(text))) {
    const path = match[0].replace(/[).,'"`]+$/, "");
    if (path.startsWith("/api/")) paths.add(path.split("?")[0]);
  }
  return paths;
}

function readJoined(files) {
  return files.map((file) => readFileSync(join(root, file), "utf8")).join("\n");
}

const found = {};
for (const [platform, files] of Object.entries(sources)) {
  found[platform] = extractPaths(readJoined(files));
}

const errors = [];
const documented = new Map();

for (const endpoint of contract.endpoints) {
  const platforms = endpoint.platforms || [];
  documented.set(endpoint.path, platforms);
  for (const platform of platforms) {
    if (!found[platform]) {
      errors.push(`${endpoint.path}: unknown platform ${platform}`);
      continue;
    }
    if (!found[platform].has(endpoint.path)) {
      errors.push(`${endpoint.path}: listed for ${platform} but not found in ${sources[platform].join(", ")}`);
    }
  }
}

for (const [platform, paths] of Object.entries(found)) {
  for (const path of paths) {
    const platforms = documented.get(path);
    if (!platforms) {
      errors.push(`${path}: found in ${platform} sources but missing from docs/api-contract.json`);
      continue;
    }
    if (!platforms.includes(platform)) {
      errors.push(`${path}: found in ${platform} sources but contract platforms are ${platforms.join(",")}`);
    }
  }
}

if (contract.search?.defaultLimit !== 40 || contract.search?.maxLimit !== 80) {
  errors.push("search limits in contract must be default 40 / max 80");
}

const readerJs = readFileSync(join(root, "lib/reader.js"), "utf8");
if (!readerJs.includes("MAX_SEARCH_RESULTS = 80") || !readerJs.includes("clampPositiveInt(options.limit, 40")) {
  errors.push("lib/reader.js search clamp is not default 40 / max 80");
}

const missingIosImport = !found.ios.has("/api/import/url");
const importEp = contract.endpoints.find((item) => item.path === "/api/import/url");
if (!missingIosImport) {
  errors.push("iOS unexpectedly implements /api/import/url; update contract and PR14");
} else if (importEp?.platforms?.includes("ios")) {
  errors.push("/api/import/url must not list ios until PR14");
}

if (errors.length) {
  console.error(`API parity failed (${errors.length}):`);
  for (const error of errors) console.error(" -", error);
  process.exit(1);
}

const counts = Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.size]));
console.log(`API parity ok · endpoints ${contract.endpoints.length} · scanned`, counts);
