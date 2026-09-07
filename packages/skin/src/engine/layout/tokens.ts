
import { DERIVED_SCALES } from "@web-core/style";

// Литералы держат в паре со ступенями шкалы "space" (packages/style/src/engine/dimension.ts).
// Рассинхрон не проходит молча: `spaceVar` сверяется с самой шкалой в рантайме, а не с этим списком.
export type SpaceToken =
  | "space-1"
  | "space-2"
  | "space-3"
  | "space-4"
  | "space-6"
  | "space-8"
  | "space-12"
  | "space-16"
  | "space-24"
  | "space-32";

const KNOWN_SPACE_STEPS: ReadonlySet<string> = new Set(
  DERIVED_SCALES.find((scale) => scale.seed === "space")!.steps.map((step) => step.name),
);

export function spaceVar(token: SpaceToken): string {
  if (!KNOWN_SPACE_STEPS.has(token)) {
    throw new Error(
      `layout: "${token}" is not a step of the "space" scale — known: ${[...KNOWN_SPACE_STEPS].join(", ")}`,
    );
  }

  return `var(--${token})`;
}
