// Design notes: ./README.md#declare

import type { ScaleDeclaration, SeededScale } from "../recipe/index.js";

export function declared(declaration: ScaleDeclaration): SeededScale {
  return typeof declaration === "string" ? { seed: declaration } : declaration;
}
