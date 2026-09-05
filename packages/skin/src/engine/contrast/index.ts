
import { AA_NON_TEXT, AA_TEXT, contrastRatio, type Oklch } from "@web-core/style";
import { passportLookup } from "../address/index.js";
import type { ComponentPassport } from "../passport/form/index.js";
import { skinRules } from "../rules/index.js";
import type { Skin } from "../recipe/index.js";
import { skinValues, type SkinHalf } from "../seeds/index.js";
import { trace } from "../../trace/index.js";
import { byPart, foldedAt, partOfKey } from "./fold.js";
import { readColour } from "./read.js";
import type { ContrastAddress, ContrastNote, ContrastQuestion, ContrastReport, UncheckedQuestion } from "./types.js";

export type {
  ContrastAddress,
  ContrastNote,
  ContrastQuestion,
  ContrastReport,
  UncheckedQuestion,
  UnreckonableReason,
} from "./types.js";

export const INDISTINCT = 1.1;

const BACKGROUND = ["background-color", "background"];

const FOREGROUND: readonly (readonly [property: string, question: ContrastQuestion])[] = [
  ["color", "text"],
  ["border-color", "distinct"],
  ["outline-color", "distinct"],
  ["fill", "non-text"],
  ["stroke", "non-text"],
];

const OUTSIDE_UNCHECKED = {
  question: "border against the outside",
  means:
    "the count doesn't check a border's contrast against whatever sits NEXT TO the node. The norm " +
    "(WCAG 2.2, 1.4.11) asks exactly that, but what sits next to a node is known by the tree, and " +
    "a skin is independent of the tree on purpose: it addresses coordinates, not places. The count " +
    "answers the neighboring question — is the border distinct from the fill it outlines",
} as const;

function pairKey(half: SkinHalf, property: string, front: string, back: string): string {
  return `${half}|${property}|${front}|${back}`;
}

export function skinContrast(skin: Skin, passports: Iterable<ComponentPassport>): ContrastReport {
  const done = trace(`skinContrast(${skin.name})`);

  const { rules } = skinRules(skin, passportLookup(passports));
  const groups = byPart(rules);
  const notes: ContrastNote[] = [];
  const bordered = new Set<string>();

  for (const half of ["light", "dark"] as const) {
    const values = skinValues(skin, half);
    const seen = new Set<string>();

    for (const rule of rules) {
      const at: ContrastAddress = {
        component: rule.coordinate.component,
        part: rule.coordinate.part,
        variants: rule.coordinate.variants,
        states: rule.coordinate.states,
      };
      const fallbackVariant = skin.recipes[at.component]?.defaultVariant;
      const props = foldedAt(groups.get(partOfKey(at)) ?? [], at, fallbackVariant);

      for (const [property, question] of FOREGROUND) {
        const front = props.get(property);
        if (front === undefined) continue;

        if (question === "distinct") bordered.add(property);

        const back = BACKGROUND.map((name) => props.get(name)).find((v) => v !== undefined);

        if (back === undefined) {
          if (seen.has(pairKey(half, property, front, "—"))) continue;
          seen.add(pairKey(half, property, front, "—"));
          notes.push({
            kind: "unreckonable",
            half,
            where: at,
            property,
            question,
            reason: "no-background",
            means:
              `coordinate "${at.component}.${at.part}" declares ${property}, but no fill: the ` +
              "skin doesn't say what's underneath it, and there's nothing to count the pair from",
          });
          continue;
        }

        if (seen.has(pairKey(half, property, front, back))) continue;
        seen.add(pairKey(half, property, front, back));

        const first = readColour(front, values);
        const second = readColour(back, values);
        const failed = "reason" in first ? first : "reason" in second ? second : undefined;

        if (failed) {
          notes.push({
            kind: "unreckonable",
            half,
            where: at,
            property,
            question,
            reason: failed.reason,
            means: `${failed.means} (${property}: ${front} against ${back})`,
          });
          continue;
        }

        const foreground = first as { colour: Oklch; text: string };
        const background = second as { colour: Oklch; text: string };
        const ratio = Math.round(contrastRatio(foreground.colour, background.colour) * 100) / 100;
        const where = `"${at.component}.${at.part}"`;
        const side = half === "light" ? "light" : "dark";

        if (question === "distinct") {
          if (ratio >= INDISTINCT) continue;

          notes.push({
            kind: "indistinct",
            half,
            where: at,
            property,
            question,
            foreground: foreground.text,
            background: background.text,
            ratio,
            means:
              `${property} at coordinate ${where} is not distinct from the fill it outlines ` +
              `(${ratio.toFixed(2)}; ${side} half). The border exists in the record and is not visible on the node`,
          });
          continue;
        }

        const required = question === "text" ? AA_TEXT : AA_NON_TEXT;
        if (ratio >= required) continue;

        notes.push({
          kind: "low",
          half,
          where: at,
          property,
          question,
          foreground: foreground.text,
          background: background.text,
          ratio,
          required,
          means:
            `${question === "text" ? "text" : "a non-text element"} at coordinate ${where} gives ` +
            `${ratio.toFixed(2)} against a norm of ${required} (${side} half)`,
        });
      }
    }
  }

  const unchecked: UncheckedQuestion[] = bordered.size > 0 ? [{ ...OUTSIDE_UNCHECKED, properties: [...bordered].toSorted() }] : [];

  done();
  return { notes, unchecked };
}
