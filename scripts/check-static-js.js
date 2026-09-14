import { readdirSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staticDir = join(root, "static");

function walkJs(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJs(path));
    else if (entry.name.endsWith(".js")) out.push(path);
  }
  return out;
}

const allJs = walkJs(staticDir);
const moduleJs = walkJs(join(staticDir, "js"));
const errors = [];

for (const file of allJs) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    errors.push(`${relative(root, file)}: ${result.stderr || result.stdout || "check failed"}`);
  }
}

if (errors.length) {
  console.error(`static JS check failed (${errors.length}):`);
  for (const error of errors) console.error(" -", error.trim());
  process.exit(1);
}

console.log(
  `static JS check ok · ${allJs.length} file(s) under static/**/*.js · ${moduleJs.length} file(s) under static/js/**/*.js`,
);
