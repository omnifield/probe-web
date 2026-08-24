// Адаптер — ПЕРЕХОДНИК на входе: принимаем чужую форму, отдаём нашу.
//
// Это ПАТТЕРН, а не принадлежность таблицы (решение user 2026-08-11). Рынок его именует —
// «Adapter» у Банды четырёх, «Anti-Corruption Layer» у Эванса, «Message Translator» у
// Хоупа с Вульфом, — но ни один орган по стандартизации его как целое НЕ нормирует. Зато
// нормированы части, и они здесь и взяты (разбор — `TABLES-9`):
//
//   • отображение имён — ДАННЫЕ, а не код: JSON-LD `@context` и R2RML независимо пришли к
//     тому, что соответствие «их ключ → наш термин» хранится и передаётся как документ;
//   • преобразование значений — правила плюс правило ПО УМОЛЧАНИЮ на случай, когда ни одно
//     не подошло (XSLT: built-in template rules);
//   • несовпадение формы во времени — Avro: нет поля, но есть умолчание → умолчание; лишнее
//     поле → игнорируем; нет поля и умолчания нет → ошибка.
//
// ЗАТОЧКА ПОД НАС НАЗВАНА ЗАРАНЕЕ. Выход адаптера — наш канон: плоский набор строк плюс
// словарь полей, на котором стоят отбор, таблица и график. Когда переходник вынесут отдельным
// продуктом (план user: «сделаем универсальный и пересядешь»), снимать придётся ровно это —
// предположение о том, что цель всегда набор строк. Всё остальное — форма файла, набор
// действий, отчёт о непонятом — от таблицы не зависит.

import type { FieldRef } from "../dataset/index.js";

export type { FieldRef, FieldSpec, Row } from "../dataset/index.js";

/** Версия формата файла адаптера. Поднимается при несовместимом изменении формы. */
export const ADAPTER_FORMAT_VERSION = 1;

/**
 * Что можно сделать со значением.
 *
 * Набор ЗАКРЫТЫЙ, и это решение с ценой (user 2026-08-11): произвол достигается СОСТАВОМ —
 * шаги складываются в цепочку, из конечного набора собирается сколь угодно сложное. Но сами
 * действия объявлены, и за каждое отвечаем мы. Открытый набор означал бы, что подменяемый
 * файл умеет выполнять произвольный код у пользователя в браузере, — а файл для того и
 * отделён от сборки, чтобы его подменяли.
 */
export type StepKind =
  | "trim"
  | "lower"
  | "upper"
  | "concat"
  | "split"
  | "replace"
  | "number"
  | "multiply"
  | "divide"
  | "round"
  | "date"
  | "bool"
  | "dictionary"
  | "coalesce"
  | "default"
  | "constant";

/** Убрать пробелы по краям. */
export interface TrimStep {
  kind: "trim";
}

/** Привести к нижнему или верхнему регистру. */
export interface CaseStep {
  kind: "lower" | "upper";
}

/** Склеить с другими полями их строки и/или с постоянными кусками. */
export interface ConcatStep {
  kind: "concat";
  /** Что приклеить: путь в их строке (`/last_name`) или постоянный текст. */
  parts: Array<{ from?: FieldRef; text?: string }>;
  separator?: string;
}

/** Разрезать по разделителю и взять кусок. */
export interface SplitStep {
  kind: "split";
  separator: string;
  /** Номер куска с нуля; отрицательный — с конца. */
  take: number;
}

/** Заменить подстроку. */
export interface ReplaceStep {
  kind: "replace";
  find: string;
  with: string;
}

/** Превратить в число. */
export interface NumberStep {
  kind: "number";
}

/** Умножить или разделить. Копейки в рубли — это `divide` на сто. */
export interface ScaleStep {
  kind: "multiply" | "divide";
  by: number;
}

/** Округлить до знаков после запятой. */
export interface RoundStep {
  kind: "round";
  digits?: number;
}

/** Разобрать дату и отдать её в ISO — виде, который понимают все наши представления. */
export interface DateStep {
  kind: "date";
  /** Откуда разбирать: ISO, `дд.мм.гггг`, секунды или миллисекунды с начала эпохи. */
  from?: "iso" | "dmy" | "unix" | "unix-ms";
}

/** Превратить в да/нет. */
export interface BoolStep {
  kind: "bool";
}

/** Заменить по словарю: их коды на наши значения. */
export interface DictionaryStep {
  kind: "dictionary";
  values: Record<string, string>;
  /** Значения не из словаря: оставить как есть или считать несопоставимыми. */
  otherwise?: "keep" | "fail";
}

/** Взять первое непустое из перечисленных путей их строки. */
export interface CoalesceStep {
  kind: "coalesce";
  from: FieldRef[];
}

/** Подставить значение, если к этому шагу ничего не набралось. */
export interface DefaultStep {
  kind: "default";
  value: string;
}

/** Постоянное значение — не зависит от их данных вовсе. */
export interface ConstantStep {
  kind: "constant";
  value: string;
}

export type Step =
  | TrimStep
  | CaseStep
  | ConcatStep
  | SplitStep
  | ReplaceStep
  | NumberStep
  | ScaleStep
  | RoundStep
  | DateStep
  | BoolStep
  | DictionaryStep
  | CoalesceStep
  | DefaultStep
  | ConstantStep;

/**
 * Что делать, когда поле не собралось.
 *
 * Три ответа рынка на один вопрос — и общей нормы нет: JSON-LD молча отбрасывает, Avro
 * поднимает ошибку либо берёт умолчание, protobuf терпит. Значит выбор наш, и он сделан НЕ
 * один раз на всё: у каждого поля свой, потому что «телефон не разобрался» и «сумма не
 * разобралась» — это разные по цене события.
 */
export type OnFail = "skip" | "default" | "reject";

export interface FieldRule {
  /** Куда кладём — путь в НАШЕМ каноне (`/applicant`). */
  target: FieldRef;
  /** Откуда берём — путь в ИХ строке. Не нужен, когда первый шаг сам добывает значение. */
  from?: FieldRef;
  steps?: Step[];
  /** По умолчанию — `skip`: поля просто не будет, и это честнее подстановки. */
  onFail?: OnFail;
  /** Значение для `default`. */
  fallback?: string;
}

export interface AdapterSpec {
  version: typeof ADAPTER_FORMAT_VERSION;
  label?: string;
  /**
   * Где в их ответе лежит набор строк.
   *
   * Отдельным полем, потому что заворачивают все по-разному: `/data/items`, `/result`,
   * `/payload/rows` — или не заворачивают вовсе, и тогда путь пустой.
   */
  rows: FieldRef;
  fields: FieldRule[];
  /**
   * Их поля, для которых правил нет.
   *
   * `drop` (по умолчанию) — не тащим в канон: канон затем и нужен, чтобы чужая форма в него
   * не просачивалась. `keep` — проносим как есть; иногда быстрее довезти лишнее, чем ждать
   * правки адаптера.
   */
  extra?: "drop" | "keep";
}

export const EMPTY_ADAPTER: AdapterSpec = {
  version: ADAPTER_FORMAT_VERSION,
  rows: "",
  fields: [],
};

export const STEP_LABELS: Record<StepKind, string> = {
  trim: "убрать пробелы",
  lower: "строчными",
  upper: "прописными",
  concat: "склеить",
  split: "разрезать и взять кусок",
  replace: "заменить подстроку",
  number: "в число",
  multiply: "умножить",
  divide: "разделить",
  round: "округлить",
  date: "разобрать дату",
  bool: "в да/нет",
  dictionary: "заменить по словарю",
  coalesce: "первое непустое",
  default: "подставить, если пусто",
  constant: "постоянное значение",
};

export const ON_FAIL_LABELS: Record<OnFail, string> = {
  skip: "оставить поле пустым",
  default: "подставить умолчание",
  reject: "забраковать строку",
};

/**
 * Предел длины цепочки.
 *
 * Не про безопасность выражений — действия и так объявлены, — а про подменённый файл с
 * тысячей шагов на поле: вкладка не должна вставать колом из-за чужой опечатки.
 */
export const MAX_STEPS = 32;
