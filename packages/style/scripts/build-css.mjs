import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist/css");

const generate = await import(pathToFileURL(resolve(root, "dist/css/generate.js")).href);

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "base.css"), generate.baseCss(), "utf8");
