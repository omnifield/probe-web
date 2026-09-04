// Design notes: ./README.md#step-purpose

import type { StepPurposeClass } from "@web-core/style";
import { colorStepPurpose } from "../vocabulary/scale-roles.js";
import type { VariableHome } from "../variables/index.js";
import { Flaws } from "./flaws.js";
import { VAR_REFERENCE } from "./var-reference.js";

/**
 * Настоящие (не custom) CSS-свойства, у которых смысл заранее известен: одни красят текст/иконку
 * («краска», ступени 11/12/`contrast`), другие — заливку и границу («заливка», ступени 1–10).
 * Свойство вне списка ничего не обещает и гейтом не проверяется — как и custom-property без
 * объявленного `colorPurpose` в паспорте: молчание значит «нечего проверять», а не «разрешено всё».
 */
const CSS_PROPERTY_PURPOSE: Readonly<Record<string, StepPurposeClass>> = {
  color: "ink",
  fill: "ink",
  stroke: "ink",
  caretColor: "ink",
  textDecorationColor: "ink",
  columnRuleColor: "ink",

  background: "fill",
  backgroundColor: "fill",
  borderColor: "fill",
  borderTopColor: "fill",
  borderRightColor: "fill",
  borderBottomColor: "fill",
  borderLeftColor: "fill",
  borderInlineColor: "fill",
  borderInlineStartColor: "fill",
  borderInlineEndColor: "fill",
  borderBlockColor: "fill",
  borderBlockStartColor: "fill",
  borderBlockEndColor: "fill",
  outlineColor: "fill",
};

function expectedPurpose(
  property: string,
  homes: ReadonlyMap<string, readonly VariableHome[]>,
): StepPurposeClass | undefined {
  if (!property.startsWith("--")) return CSS_PROPERTY_PURPOSE[property];

  return homes.get(property)?.find((home) => home.colorPurpose !== undefined)?.colorPurpose;
}

const CLASS_TEXT: Record<StepPurposeClass, string> = { fill: "заливку/границу", ink: "текст/иконку" };
const PROMISE_TEXT: Record<StepPurposeClass, string> = { fill: "не даётся", ink: "есть" };

/**
 * Проверяет, что значение ОДНОГО свойства (или custom-property, объявленной паспортом как
 * цветовой контейнер) ссылается на ступень своего класса — заливку на заливку, краску на краску.
 * Свойство, у которого класс не известен ни таблицей выше, ни паспортом, пропускается: гейту
 * нечего с ним сверять.
 */
export function checkStepPurpose(
  property: string,
  value: string | number,
  at: string,
  flaws: Flaws,
  homes: ReadonlyMap<string, readonly VariableHome[]> = new Map(),
): void {
  if (typeof value !== "string") return;

  const expected = expectedPurpose(property, homes);
  if (expected === undefined) return;

  for (const [, name] of value.matchAll(VAR_REFERENCE)) {
    const found = colorStepPurpose(name!);
    if (found === undefined || found === expected) continue;

    flaws.add(
      "step-purpose-mismatch",
      at,
      `"${property}" красит ${CLASS_TEXT[expected]}, а "${name}" — ступень класса «${found === "fill" ? "заливка" : "краска"}» ` +
        `(обещание контраста ${PROMISE_TEXT[found]} — см. STEP_PURPOSE/NO_PROMISE, packages/style). ` +
        `Нужна ступень класса «${expected === "fill" ? "заливка" : "краска"}»`,
    );
  }
}
