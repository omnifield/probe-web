// ГРАНИЦА МОДУЛЯ АДАПТЕРА — единственная опубликованная поверхность.
//
// Модуль стоит ДО всех представлений: он принимает чужой ответ и отдаёт наш канон. Про
// таблицу, фильтр и график он не знает ничего, кроме словаря полей, — и это не случайность:
// по плану user переходник вынесут отдельным продуктом («сделаем универсальный и
// пересядешь»). Значит выезд обязан быть переносом папки, а не переписыванием, и граница
// объявлена сейчас, ровно как в своё время у фильтров.
//
// Что при выносе придётся снять — названо в `model.ts`: предположение о том, что цель всегда
// наш канон строк. Всё остальное — форма файла, набор действий, отчёт — от таблицы не зависит.
//
// `trace.js` наружу не выходит: замер — внутреннее дело модуля.

export { type Adapted, type AdapterIssue, type AdapterReport, applyAdapter } from "./apply.js";
export {
  ADAPTER_FORMAT_VERSION,
  type AdapterSpec,
  type BoolStep,
  type CaseStep,
  type CoalesceStep,
  type ConcatStep,
  type ConstantStep,
  type DateStep,
  type DefaultStep,
  type DictionaryStep,
  EMPTY_ADAPTER,
  type FieldRef,
  type FieldRule,
  MAX_STEPS,
  type NumberStep,
  type OnFail,
  ON_FAIL_LABELS,
  type ReplaceStep,
  type RoundStep,
  type Row,
  type ScaleStep,
  type SplitStep,
  type Step,
  type StepKind,
  STEP_LABELS,
  type TrimStep,
} from "./model.js";
export { parseAdapter, type ParsedAdapter, serializeAdapter } from "./parse.js";
export { assign, discoverPaths, discoverRowPaths, discoverRowSets, pointerOf } from "./paths.js";
export { isBlank, runStep, runSteps, type StepResult } from "./steps.js";
export { AdapterBuilder, type AdapterBuilderProps } from "./ui/adapter-builder.jsx";
