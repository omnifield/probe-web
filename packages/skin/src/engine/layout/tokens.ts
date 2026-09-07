
import { DERIVED_SCALES } from "@web-core/style";

function knownSteps(seed: string): ReadonlySet<string> {
  return new Set(DERIVED_SCALES.find((scale) => scale.seed === seed)!.steps.map((step) => step.name));
}

function scaleVar(seed: string, known: ReadonlySet<string>, token: string): string {
  if (!known.has(token)) {
    throw new Error(`layout: "${token}" is not a step of the "${seed}" scale — known: ${[...known].join(", ")}`);
  }

  return `var(--${token})`;
}

// Литералы держат в паре со ступенями одноимённой шкалы (packages/style/src/engine/dimension.ts).
// Рассинхрон не проходит молча: каждый `*Var` сверяется с самой шкалой в рантайме, а не с этим списком.
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

const KNOWN_SPACE_STEPS = knownSteps("space");

export function spaceVar(token: SpaceToken): string {
  return scaleVar("space", KNOWN_SPACE_STEPS, token);
}

export type RailToken = "rail-sm" | "rail-md" | "rail-lg" | "rail-xl" | "rail-xxl" | "rail-xxxl" | "rail-full";

const KNOWN_RAIL_STEPS = knownSteps("rail");

export function railVar(token: RailToken): string {
  return scaleVar("rail", KNOWN_RAIL_STEPS, token);
}

export type CardToken = "card-sm" | "card-md" | "card-lg" | "card-xl" | "card-xxl" | "card-xxxl" | "card-full";

const KNOWN_CARD_STEPS = knownSteps("card");

export function cardVar(token: CardToken): string {
  return scaleVar("card", KNOWN_CARD_STEPS, token);
}

// Шкала "layout" (ширина области раскладки) и `layoutSelf`/`layoutGroup` (место элемента в потоке)
// — разные понятия, случайно делящие корень имени. `layoutVar` возвращает токен ширины, к месту
// элемента отношения не имеет.
export type LayoutToken =
  | "layout-sm"
  | "layout-md"
  | "layout-lg"
  | "layout-xl"
  | "layout-xxl"
  | "layout-xxxl"
  | "layout-full";

const KNOWN_LAYOUT_STEPS = knownSteps("layout");

export function layoutVar(token: LayoutToken): string {
  return scaleVar("layout", KNOWN_LAYOUT_STEPS, token);
}
