// см. README.md / FAQ.md — `z` через этот пакет, не напрямую из `zod`.
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
