
import { cssProperty } from "../property/index.js";
import type { StyleObject } from "../recipe/index.js";
import type { RuleCoordinate, SkinRule } from "../rules/index.js";
import type { ContrastAddress } from "./types.js";

function applies(rule: SkinRule, at: ContrastAddress, fallbackVariant: string | undefined): boolean {
  const { coordinate } = rule;

  if (coordinate.component !== at.component || coordinate.part !== at.part) return false;
  if (coordinate.ancestor) return false;
  if (coordinate.settings) return false;

  if (coordinate.variants.length > 0) {
    const named =
      at.variants.length > 0
        ? at.variants.some((variant) => coordinate.variants.includes(variant))
        : fallbackVariant !== undefined && coordinate.variants.includes(fallbackVariant);
    if (!named) return false;
  }

  return coordinate.states.every((state) => at.states.includes(state));
}

export function partOfKey(coordinate: Pick<RuleCoordinate, "component" | "part">): string {
  return `${coordinate.component}.${coordinate.part}`;
}

export function byPart(rules: readonly SkinRule[]): Map<string, SkinRule[]> {
  const groups = new Map<string, SkinRule[]>();

  for (const rule of rules) {
    const key = partOfKey(rule.coordinate);
    const kin = groups.get(key);
    if (kin) kin.push(rule);
    else groups.set(key, [rule]);
  }

  return groups;
}

export function foldedAt(rules: readonly SkinRule[], at: ContrastAddress, fallbackVariant: string | undefined): Map<string, string> {
  const props = new Map<string, string>();

  for (const rule of rules) {
    if (!applies(rule, at, fallbackVariant)) continue;

    for (const [key, value] of Object.entries(rule.style as StyleObject)) {
      if (value === undefined || typeof value === "object") continue;
      props.set(cssProperty(key), String(value));
    }
  }

  return props;
}
