
import { isMotion, motionsIn, MOTION_FAMILIES } from "../motion/index.js";
import type { StyleObject } from "../recipe/index.js";
import { homesText, referenceVerdict, type VariableHome } from "../variables/index.js";
import { checkEmpty } from "./check-value.js";
import { Flaws } from "./flaws.js";
import type { SkinRule } from "./types.js";
import { VAR_REFERENCE } from "./var-reference.js";
import type { Cursor } from "./traverse/state.js";

export type MotionSite = { readonly component: string; readonly part: string } | null;

export function checkKeyframeShape(frames: StyleObject, where: string, flaws: Flaws): void {
  for (const [stop, style] of Object.entries(frames)) {
    if (style === undefined) continue;

    const at = `${where}.${stop}`;

    if (typeof style !== "object") {
      flaws.add("free-selector", at, `motion step "${stop}" must be a property block`);
      continue;
    }

    for (const [property, value] of Object.entries(style)) {
      if (value === undefined) continue;

      if (typeof value === "object") {
        flaws.add("free-selector", `${at}.${property}`, "no nesting inside a motion step");
        continue;
      }

      checkEmpty(value, `${at}.${property}`, flaws);
    }
  }
}

export function checkKeyframeReferences(
  frames: StyleObject,
  where: string,
  movement: string,
  site: MotionSite,
  known: Set<string>,
  homes: Map<string, VariableHome[]>,
  flaws: Flaws,
): void {
  const placeText = site
    ? `motion "${movement}" is applied on part "${site.component}.${site.part}"`
    : `motion "${movement}" is not applied by any rule, and it has no node`;

  for (const [stop, style] of Object.entries(frames)) {
    if (typeof style !== "object" || style === undefined) continue;

    for (const [property, value] of Object.entries(style)) {
      if (value === undefined || typeof value === "object" || typeof value === "number") continue;

      const at = `${where}.${stop}.${property}`;

      for (const [, name, fallback] of value.matchAll(VAR_REFERENCE)) {
        if (fallback === ",") continue;

        const verdict = referenceVerdict(name!, known, homes);
        if (verdict.kind === "known") continue;

        if (verdict.kind === "elsewhere") {
          flaws.add(
            "variable-elsewhere",
            at,
            `${placeText}, and variable "${name}" is declared by the passport on a different part ` +
              `— ${homesText(verdict.homes)}. A motion step resolves on the node where \`animation:\` ` +
              "sits, and nobody sets it there. Apply the motion on that part, or move the value " +
              "into a rule addressing it",
          );
          continue;
        }

        flaws.add(
          "unknown-value",
          at,
          `${placeText}, and name "${name}" is declared by neither the skin, the vocabulary, nor ` +
            `the passport. The browser will drop the whole step. A fallback value — ` +
            `\`var(${name}, …)\` — clears the flaw`,
        );
      }
    }
  }
}

export function motionSites(
  rules: readonly SkinRule[],
  declared: ReadonlySet<string>,
): Map<string, { component: string; part: string }[]> {
  const found = new Map<string, { component: string; part: string }[]>();
  if (declared.size === 0) return found;

  for (const rule of rules) {
    const { component, part } = rule.coordinate;

    for (const movement of motionsIn(rule.style, declared)) {
      const sites = found.get(movement) ?? [];
      if (sites.some((site) => site.component === component && site.part === part)) continue;

      sites.push({ component, part });
      found.set(movement, sites);
    }
  }

  return found;
}

export function viewProperties(style: StyleObject): string[] {
  const names: string[] = [];

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;

    if (typeof value === "object") {
      names.push(...viewProperties(value));
      continue;
    }

    if (!isMotion(key)) names.push(key);
  }

  return names;
}

export function checkMotionOnly(style: StyleObject, where: string, cursor: Cursor, flaws: Flaws): void {
  if (cursor.unreliable.length === 0) return;

  const view = viewProperties(style);
  if (view.length === 0) return;

  const marks = cursor.unreliable
    .map(
      ({ component, part, state }) =>
        `"${state.name}" of part "${part}" of component "${component}" (${state.absentWhen})`,
    )
    .join("; ");

  flaws.add(
    "view-unaddressable",
    where,
    `the look is addressed by a marker that doesn't always arrive: ${marks}. The rule would land ` +
      `on some nodes but not others, and the dresser would find out by eye, not by machine. Under ` +
      `such an address only motion (${MOTION_FAMILIES.join(", ")}) is legal — the reason the state ` +
      `is declared at all; address the look (${view.join(", ")}) through an ancestor that holds ` +
      "this state reliably",
  );
}
