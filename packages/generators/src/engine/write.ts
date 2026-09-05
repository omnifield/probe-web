import { writeFileSync } from "node:fs";

import type { GeneratedFile } from "./types.js";

export function writeGeneratedFiles(files: readonly GeneratedFile[]): void {
  for (const file of files) {
    writeFileSync(file.path, file.content, "utf8");
  }
}
