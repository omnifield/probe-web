// Модель фильтра. ВНУТРЕННОСТЬ модуля: наружу типы уезжают через `../filters` (index.ts),
// и таблица не должна импортировать этот файл напрямую.
//
// Решение по форме принято 2026-08-10 с user: ПЛОСКИЙ нумерованный список условий плюс
// отдельная строка логики, а не вложенные группы. Причина — читаемость: вложенное дерево
// перестаёт читаться глазом на втором уровне, а «любое из трёх полей И имя заявителя» в
// плоском виде остаётся одной строкой.
//
// ВРЕМЕННО: набор операторов здесь выбран под опорный кейс, а не по канону рынка — фонд
// `canons/filter-tables-graphs` показывает, что единого диалекта у рынка нет, и выбор
// (CQL2-подобный / OData-подобный / свой) ещё не сделан. Меняется дёшево, пока это
// прототип на локальных данных.

/** Строка данных: набор полей, у разных строк — разный. */
export type Row = Record<string, unknown>;

/** Операторы условия по значению поля. */
export type ValueOperator = "eq" | "ne" | "contains" | "gt" | "lt";

/**
 * Что проверяем у поля.
 *
 * `exists` и `filled` разведены НАМЕРЕННО. Фонд отмечает это как редкое свойство: развести
 * «поля нет» и «поле есть, но пустое» умеет MongoDB (`$exists`), а большинство языков фильтра
 * сваливает в одно. Опорный кейс волны — именно про наличие поля, поэтому различие несущее.
 */
export type PresenceMode = "exists" | "filled";

/** Квантор по набору полей: все / хотя бы одно / ни одного. */
export type Quantifier = "all" | "any" | "none";

/** Условие по значению одного поля. */
export interface ValueCondition {
  id: string;
  kind: "value";
  field: string;
  operator: ValueOperator;
  value: string;
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
  fields: string[];
}

export type Condition = ValueCondition | PresenceCondition;

/**
 * Как условия сочетаются.
 *
 * `all` — все через И; формула скрыта, и экран выглядит как обычный простой фильтр.
 * `formula` — своя логика строкой вида `(1 И 2) ИЛИ 3`.
 *
 * Сложность появляется только когда её попросили — это одно и то же средство с двумя
 * уровнями раскрытия, а не два разных механизма фильтрации.
 */
export type Logic = { mode: "all" } | { mode: "formula"; text: string };

export interface FilterState {
  conditions: Condition[];
  logic: Logic;
}

/** Пустой фильтр — ничего не отсекает. */
export const EMPTY_FILTER: FilterState = { conditions: [], logic: { mode: "all" } };

let seq = 0;

/** Идентификатор условия. Не `Math.random` — прогон должен быть воспроизводимым. */
export function nextConditionId(): string {
  seq += 1;
  return `c${seq}`;
}

/** Подписи операторов для интерфейса. Здесь же — единственное место, где они по-русски. */
export const VALUE_OPERATOR_LABELS: Record<ValueOperator, string> = {
  eq: "равно",
  ne: "не равно",
  contains: "содержит",
  gt: "больше",
  lt: "меньше",
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
