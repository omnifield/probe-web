import { writeFileSync } from "node:fs";

import type { GeneratedFile } from "./types.js";

/** Writes every generated file to its output path, overwriting what is there. */
export function writeGeneratedFiles(files: readonly GeneratedFile[]): void {
  for (const file of files) {
    writeFileSync(file.path, file.content, "utf8");
  }
}
