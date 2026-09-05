import { existsSync } from "node:fs";
import { join } from "node:path";

export function hasFile(relativePath: string): (entryPath: string) => boolean {
  return (entryPath) => existsSync(join(entryPath, relativePath));
}
