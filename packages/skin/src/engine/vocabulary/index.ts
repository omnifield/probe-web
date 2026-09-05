
import { DENSITY_TOKEN, DERIVED_SCALES, DERIVED_TOKENS } from "@web-core/style";
import type { Role } from "./role.js";
import { ROWS } from "./rows.js";
import { SCALE_ROLES, STEPS } from "./scale-roles.js";

export type { Role, RoleKind } from "./role.js";
export { SCALE_ROLES } from "./scale-roles.js";

export const VOCABULARY: readonly Role[] = [
  ...SCALE_ROLES.flatMap((scale) => STEPS.map((step): Role => ({ name: `${scale}-${step}`, kind: "color" }))),
  ...DERIVED_SCALES.map((scale): Role => ({ name: scale.seed, kind: "size" })),
  { name: DENSITY_TOKEN, kind: "size" },
  ...DERIVED_TOKENS.map((name): Role => ({ name, kind: "size" })),
  ...ROWS.map((name): Role => ({ name, kind: "row" })),
];

export const ROLE_NAMES: ReadonlySet<string> = new Set(VOCABULARY.map((role) => role.name));

export function knownRole(name: string): boolean {
  return ROLE_NAMES.has(name.startsWith("--") ? name.slice(2) : name);
}
