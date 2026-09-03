// ПОВЕРХНОСТЬ пакета — реестр паспортов формы (PWEB-181), слои L0/L1 (PWEB-182) и L2
// (PWEB-183). L3 — следующий тикет цепочки PWEB-180.
//
// `z` — ЧЕРЕЗ ЭТОТ ПАКЕТ, не напрямую из `zod` (постановка user, 2026-08-29): компонент,
// объявляющий свою форму (`entity/io.ts` у каждого компонента кита), пишет схему инструментом,
// который ему даёт `packages/io`, — так же, как `packages/skin` не даёт компоненту второй
// способ объявить анатомию. Смени когда-нибудь всю схемную библиотеку под капотом — переписать
// придётся здесь один раз, а не в `entity/io.ts` каждого компонента порознь.
export { z } from "zod";

export { identityCodec, renameKeysCodec } from "./codecs.js";
export { compatibleItems } from "./compatible.js";
export {
  applyFieldRules,
  collectFieldRuleReport,
  convertRecord,
  fieldRulesCodec,
  type ExtraPolicy,
  type FieldRule,
  type FieldRuleIssue,
  type FieldRuleReport,
  type OnFail,
  type RecordIssue,
} from "./field-rules.js";
export {
  createIoRegistry,
  type IoDirection,
  type IoEntry,
  type IoMeta,
  type IoRegistry,
} from "./registry.js";
export { createPackRegistry, type PackRegistry } from "./packs.js";
export { discoverPaths, lookup, pointerOf, type FieldRef, type Lookup } from "./paths.js";
export {
  isBlank,
  runStep,
  runSteps,
  MAX_STEPS,
  type BoolStep,
  type CaseStep,
  type CoalesceStep,
  type ConcatStep,
  type ConstantStep,
  type DateStep,
  type DefaultStep,
  type DictionaryStep,
  type NumberStep,
  type ReplaceStep,
  type RoundStep,
  type ScaleStep,
  type SplitStep,
  type Step,
  type StepKind,
  type StepResult,
  type TrimStep,
} from "./steps.js";
