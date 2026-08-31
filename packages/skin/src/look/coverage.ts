// Design notes: ./README.md#coverage

import { SCALE_ROLES, VOCABULARY } from "../vocabulary/index.js";
import { bare } from "./bare.js";
import type { Palette } from "./types.js";

export function paletteValues(palette: Palette): Set<string> {
  const roles = new Set<string>();

  for (const half of [palette.light, palette.dark]) {
    for (const name of Object.keys(half ?? {})) roles.add(bare(name));
  }

  for (const name of Object.keys(palette.dimensions ?? {})) roles.add(bare(name));

  return roles;
}

export function closedByScales(palette: Palette): Set<string> {
  const closed = new Set<string>();

  for (const scale of Object.keys(palette.scales ?? {})) {
    for (const role of VOCABULARY) {
      if (role.kind === "color" && role.name.startsWith(`${scale}-`)) closed.add(role.name);
    }
  }

  return closed;
}

export function closedByDimensions(palette: Palette): Set<string> {
  const closed = new Set<string>();
  const seeded = new Set(Object.keys(palette.dimensions ?? {}));

  for (const role of VOCABULARY) {
    if (role.kind !== "size") continue;
    if (seeded.has(role.name)) closed.add(role.name);
    for (const seed of seeded) {
      if (role.name.startsWith(`${seed}-`)) closed.add(role.name);
    }
  }

  return closed;
}

export function summarizeByFamily(roles: readonly string[]): string {
  const families = new Map<string, number>();

  for (const role of roles) {
    const family = SCALE_ROLES.find((scale) => role.startsWith(`${scale}-`)) ?? role;
    families.set(family, (families.get(family) ?? 0) + 1);
  }

  const named = [...families].map(([family, count]) => (count > 1 ? `${family} (${count})` : family));

  return named.length > 12 ? `${named.slice(0, 12).join(", ")}, …` : named.join(", ");
}
