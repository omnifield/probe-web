// Модель фильтра. ВНУТРЕННОСТЬ модуля: наружу типы уезжают через `../filters` (index.ts),
// и таблица не должна импортировать этот файл напрямую.
//
// Решение по форме принято 2026-08-10 с user: ПЛОСКИЙ нумерованный список условий плюс
// отдельная строка логики, а не вложенные группы. Причина — читаемость: вложенное дерево
// перестаёт читаться глазом на втором уровне, а «любое из трёх полей И имя заявителя» в
// плоском виде остаётся одной строкой.
// Сверка с рынком 2026-08-11 показала: форму конструктора рынок не нормирует ВООБЩЕ (WCAG
// нормирует помощь при вводе, ARIA APG сам себя нормой не считает, ISO 9241 не проверен) —
// заимствовать вместо нашей формы нечего, решение остаётся нашим (`TABLES-4`, H.5).
//
// Набор ПРЕДИКАТОВ, в отличие от формы, взят с рынка: полный именованный набор даёт ровно
// один свод — OGC CQL2 (`= <> < > <= >=`, `IN`, `BETWEEN`, `LIKE`, `IS NULL`), остальные шесть
// языков из фонда либо комбинируют, либо оставляют серверу. Мы берём сравнение, `IN` и
// `BETWEEN`; роль `LIKE` играет `contains` (осознанное сужение — см. ниже), роль `IS NULL` —
// условие по наличию поля. Сверено 2026-08-11, разбор — `TABLES-4`, раздел C.

import type { Expr } from "./formula.js";

export type { FieldRef, Row } from "./field.js";
import type { FieldRef } from "./field.js";

/**
 * Тип поля — из словаря полей, а не угаданный по значению.
 *
 * Нужен ДВУМ вещам сразу: набору операторов, который интерфейс предлагает для поля, и разбору
 * введённого значения. Без него дата сравнивалась как текст, а `BETWEEN` не имел смысла:
 * CQL2 определяет диапазон для числового значения, а `IN` — «against a list of values of the
 * same type». Словарь полей как отдельная сущность нормирован CSVW (`словарь-полей` в фонде).
 */
export type FieldType = "text" | "number" | "date" | "bool";

/** Поле, доступное в условиях: чем адресуется, как называется, какого типа. */
export interface FieldSpec {
  /** Ссылка-путь (JSON Pointer), например `/contact/phone`. */
  name: FieldRef;
  label: string;
  type: FieldType;
}

export type FieldDictionary = readonly FieldSpec[];

/**
 * Операторы сравнения. Имена буквенные (`eq`/`ne`/`ge`/`le`) — семья OData/PostgREST.
 *
 * Единого ИМЕНИ у рынка нет: `eq` · `=` · `==` · `$eq` — пять записей одного смысла на семь
 * языков (сводка фонда `digests/operator-naming-across-sources.md`). Выбор наш и стоит он
 * переносимости: буквенные имена не требуют экранирования в URL, куда фильтр однажды поедет.
 *
 * `contains` — это `LIKE`, а НЕ поиск: он не ранжирует. Рынок разводит точный отбор и
 * ранжированный поиск систематически (Elasticsearch `filter`/`must`, OData `$filter`/`$search`,
 * PostgREST `like`/`fts`), и сливать их в один оператор нельзя (`TABLES-4`, H.3).
 */
export type ComparisonOperator = "eq" | "ne" | "contains" | "gt" | "ge" | "lt" | "le";

/** Что проверяем у поля: присутствует / заполнено. */
export type PresenceMode = "exists" | "filled";

/** Квантор по набору полей: все / хотя бы одно / ни одного. */
export type Quantifier = "all" | "any" | "none";

/** Сравнение значения поля с одним значением. */
export interface ComparisonCondition {
  id: string;
  kind: "compare";
  field: FieldRef;
  operator: ComparisonOperator;
  value: string;
  /**
   * Учитывать регистр. По умолчанию НЕТ.
   *
   * Флагом, а не парой операторов: рынок выражает это двумя именами (`like` против `ilike` у
   * PostgREST), но в плоском списке два почти одинаковых пункта в выпадашке читаются хуже,
   * чем один флажок у условия. Смысл тот же, запись наша.
   */
  sensitive?: boolean;
}

/** Членство в списке значений — CQL2 `IN`. Одно условие вместо N условий и формулы `ИЛИ`. */
export interface MemberCondition {
  id: string;
  kind: "in";
  field: FieldRef;
  values: string[];
}

/** Диапазон — CQL2 `BETWEEN`. ВКЛЮЧИТЕЛЬНЫЙ: в стандарте это сказано прямо (Requirement 6). */
export interface RangeCondition {
  id: string;
  kind: "between";
  field: FieldRef;
  from: string;
  to: string;
}

/**
 * Условие по НАЛИЧИЮ полей — одно условие на весь набор.
 *
 * Это и есть ответ на опорный кейс: «оставить те, где есть любое из трёх полей» — ОДНО
 * условие, а не три условия и группа `ИЛИ` вокруг них. Ради этого квантор и введён в модель.
 */
export interface PresenceCondition {
  id: string;
  kind: "presence";
  quantifier: Quantifier;
  mode: PresenceMode;
  fields: FieldRef[];
}

export type Condition =
  | ComparisonCondition
  | MemberCondition
  | RangeCondition
  | PresenceCondition;

export type ConditionKind = Condition["kind"];

/**
 * Как условия сочетаются.
 *
 * `all` — все через И; формула скрыта, и экран выглядит как обычный простой фильтр.
 * `formula` — своя логика; хранится РАЗОБРАННЫМ деревом, а не текстом.
 *
 * Почему деревом. Раньше формула была строкой с НОМЕРАМИ условий, а номер — позиционная
 * ссылка на изменяемый набор: удалили условие №1 — и `(1 И 2) ИЛИ 3` молча стало значить
 * другое. RFC 6901 называет цену позиционной адресации прямо, а устойчивый идентификатор у
 * условий у нас уже был. Теперь дерево ссылается на `id`, номер живёт только на экране
 * (`TABLES-4`, раздел B).
 */
export type Logic = { mode: "all" } | { mode: "formula"; expr: Expr };

/** Версия формата состояния. Поднимается при несовместимом изменении формы. */
export const FILTER_FORMAT_VERSION = 1;

export interface FilterState {
  /**
   * Версия формата — с первого дня.
   *
   * Единой нормы на сериализацию фильтра у рынка НЕТ (пробел фонда, перебраны 7 языков и три
   * несовместимые модели). Раз общего свода нет, читателю никто, кроме нас, не скажет, какую
   * форму он держит в руках (`TABLES-4`, раздел F).
   */
  version: typeof FILTER_FORMAT_VERSION;
  conditions: Condition[];
  logic: Logic;
}

/** Пустой фильтр — ничего не отсекает. */
export const EMPTY_FILTER: FilterState = {
  version: FILTER_FORMAT_VERSION,
  conditions: [],
  logic: { mode: "all" },
};

let seq = 0;

/** Идентификатор условия. Не `Math.random` — прогон должен быть воспроизводимым. */
export function nextConditionId(): string {
  seq += 1;
  return `c${seq}`;
}

/**
 * Подвинуть счётчик за уже занятые идентификаторы.
 *
 * Зачем: состояние, прочитанное из JSON, приносит свои `c1..cN`, а счётчик модуля начинается
 * с нуля и выдал бы ТЕ ЖЕ имена. Столкновение проявилось бы как «правлю одно условие,
 * меняется другое» — и только после того, как появится сохранение. Вызывается при разборе
 * состояния (`serialize.ts`), а не руками.
 */
export function reserveConditionIds(ids: Iterable<string>): void {
  for (const id of ids) {
    const own = /^c([0-9]+)$/.exec(id);
    if (own) seq = Math.max(seq, Number(own[1]));
  }
}

/** Подписи операторов для интерфейса. Здесь же — единственное место, где они по-русски. */
export const COMPARISON_OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  eq: "равно",
  ne: "не равно",
  contains: "содержит",
  gt: "больше",
  ge: "больше или равно",
  lt: "меньше",
  le: "меньше или равно",
};

export const QUANTIFIER_LABELS: Record<Quantifier, string> = {
  all: "все из",
  any: "любое из",
  none: "ни одного из",
};

export const PRESENCE_MODE_LABELS: Record<PresenceMode, string> = {
  exists: "поле присутствует",
  filled: "поле заполнено",
};

export const CONDITION_KIND_LABELS: Record<ConditionKind, string> = {
  compare: "сравнение",
  in: "одно из списка",
  between: "диапазон",
  presence: "наличие полей",
};

/**
 * Какие операторы предлагать для поля этого типа.
 *
 * `contains` — только для текста: подстрока в числе или дате означала бы сравнение их
 * ТЕКСТОВОГО вида, а это ровно та молчаливая подмена, из-за которой «10» оказывалось меньше
 * «9». Порядковые операторы у текста оставлены: лексикографический порядок — законный ответ,
 * когда его просят явно.
 */
export function operatorsFor(type: FieldType): readonly ComparisonOperator[] {
  switch (type) {
    case "text":
      return ["eq", "ne", "contains", "gt", "ge", "lt", "le"];
    case "number":
    case "date":
      return ["eq", "ne", "gt", "ge", "lt", "le"];
    case "bool":
      return ["eq", "ne"];
  }
}

/** Осмыслен ли диапазон для типа. У булева и текста `BETWEEN` не предлагаем. */
export function supportsRange(type: FieldType): boolean {
  return type === "number" || type === "date";
}

/**
 * УСЛОВИЕ НЕДОПИСАНО — форма собрана, а чем её наполнить, ещё не сказано.
 *
 * Это не ошибка: недописанное условие законно существует ровно с той секунды, как его
 * добавили, и ругаться на него сразу значит ругаться на человека за то, что он ещё не
 * закончил печатать. Но и молчать нельзя — недописанное условие отбирает не то, что от него
 * ждут, и заметить это по одному счётчику трудно.
 *
 * Поэтому наружу это едет ОТДЕЛЬНЫМ состоянием, а не текстом ошибки: показать его — и когда
 * показать — решает тот, кто одевает.
 *
 * Пустое значение сравнения считается недописанным, хотя ищется законно (пустая строка —
 * значение). Цена принята: «дописать» дешевле, чем не заметить пустую строку в отборе.
 */
export function isIncomplete(condition: Condition): boolean {
  switch (condition.kind) {
    case "compare":
      return condition.value.trim() === "";
    case "in":
      // Список из одних пустых строк — тот же недописанный список, что и пустой.
      return condition.values.every((value) => value.trim() === "");
    case "between":
      // Достаточно ОДНОЙ границы: полуоткрытый диапазон осмыслен, пустой — нет.
      return condition.from.trim() === "" && condition.to.trim() === "";
    case "presence":
      return condition.fields.length === 0;
  }
}
