// Design notes: ./README.md#scale-roles

import { SCALE_STEPS, STEP_PURPOSE_CLASS, type ScaleKey, type StepPurposeClass } from "@omnifield/probe-web-style";

export const SCALE_ROLES: readonly string[] = ["accent", "neutral", "danger", "success", "warning"];

export const STEPS: readonly string[] = [...SCALE_STEPS.map(String), "contrast"];

// Тот же перебор «семья × ступень», каким `VOCABULARY` (`./index.ts`) строит полный перечень имён
// цвета, — здесь строит обратный словарь «полное имя → класс назначения» для гейта
// (`../rules/step-purpose.ts`). Не два перебора врозь: разойдись они, гейт узнавал бы про ступень
// то, чего не знает `VOCABULARY`, и наоборот.
const COLOR_STEP_PURPOSE: ReadonlyMap<string, StepPurposeClass> = new Map(
  SCALE_ROLES.flatMap((scale) =>
    STEPS.map((step): [string, StepPurposeClass] => [`--${scale}-${step}`, STEP_PURPOSE_CLASS[step as ScaleKey]]),
  ),
);

/** Класс назначения ступени по полному имени переменной (`--accent-9` → `fill`). Не имя цветовой шкалы — `undefined`. */
export function colorStepPurpose(name: string): StepPurposeClass | undefined {
  return COLOR_STEP_PURPOSE.get(name.startsWith("--") ? name : `--${name}`);
}
