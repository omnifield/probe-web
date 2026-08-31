// Design notes: ./README.md#families

import { cssProperty } from "../property/index.js";

export const MOTION_FAMILIES = ["animation", "transition"] as const;

export function isMotion(property: string): boolean {
  const name = cssProperty(property);

  return MOTION_FAMILIES.some((family) => name === family || name.startsWith(`${family}-`));
}
