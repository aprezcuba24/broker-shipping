import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDir = process.cwd();
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourcePath = path.join(appDir, "wrangler.jsonc");

if (!existsSync(sourcePath)) {
  console.error(`No wrangler.jsonc in ${appDir}`);
  process.exit(1);
}

const config = JSON.parse(readFileSync(sourcePath, "utf8"));
const assetsDirectory = config.assets?.directory;

if (typeof assetsDirectory !== "string" || assetsDirectory.length === 0) {
  console.error(`${sourcePath} has no assets.directory`);
  process.exit(1);
}

const absoluteAssets = path.resolve(appDir, assetsDirectory);

if (!existsSync(absoluteAssets)) {
  console.error(`Assets directory not found: ${absoluteAssets}`);
  process.exit(1);
}

const relativeAssets = path.relative(repoRoot, absoluteAssets);
config.assets.directory = `./${relativeAssets.split(path.sep).join("/")}`;

const destination = path.join(repoRoot, "wrangler.jsonc");
writeFileSync(destination, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${destination} (assets: ${config.assets.directory})`);
