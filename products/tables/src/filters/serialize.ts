// Чтение и запись состояния фильтра как ДАННЫХ.
//
// Форма (фильтр — сериализуемая структура, а не функция) рынком подтверждена: крупнейшая
// практика делает ровно это — условие MongoDB есть документ, а не строка. А вот СХЕМА
// сериализации у рынка не нормирована вовсе: перебор 7 языков дал три несовместимые модели
// (параметр-на-условие · одно-выражение · структура-в-теле), и общего свода нет.
//
// Отсюда два следствия, ради которых этот файл существует (`TABLES-4`, раздел F):
//
//   1. ВЕРСИЯ ФОРМАТА с первого дня — раз общего свода нет, читателю никто, кроме нас, не
//      скажет, какую форму он держит в руках.
//   2. ЧУЖОЙ JSON ПРОВЕРЯЕТСЯ, а не принимается на веру: состояние приезжает с бэка и из
//      сохранённых пользователем сборок, то есть из-за границы модуля.

import { isFieldRef } from "./field.js";
import { type Expr, danglingIds } from "./formula.js";
import {
  type ComparisonOperator,
  type Condition,
  FILTER_FORMAT_VERSION,
  type FilterState,
  type Logic,
  type PresenceMode,
  type Quantifier,
  reserveConditionIds,
} from "./model.js";

export type ParsedFilter = { ok: true; state: FilterState } | { ok: false; error: string };

const OPERATORS = new Set<string>(["eq", "ne", "contains", "gt", "ge", "lt", "le"]);
const MODES = new Set<string>(["exists", "filled"]);
const QUANTIFIERS = new Set<string>(["all", "any", "none"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string";
}

function isTextList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isText);
}

function parseExpr(input: unknown, where: string): Expr | string {
  if (!isObject(input)) return `${where}: узел логики должен быть объектом`;

  switch (input["t"]) {
    case "ref": {
      const id = input["id"];
      if (!isText(id) || id === "") return `${where}: ссылка без идентификатора условия`;
      return { t: "ref", id };
    }
    case "not": {
      const a = parseExpr(input["a"], where);
      return typeof a === "string" ? a : { t: "not", a };
    }
    case "and":
    case "or": {
      const a = parseExpr(input["a"], where);
      if (typeof a === "string") return a;
      const b = parseExpr(input["b"], where);
      if (typeof b === "string") return b;
      return { t: input["t"], a, b };
    }
    default:
      return `${where}: неизвестный узел логики «${String(input["t"])}»`;
  }
}

function parseCondition(input: unknown, index: number): Condition | string {
  const where = `условие №${index + 1}`;
  if (!isObject(input)) return `${where}: должно быть объектом`;

  const id = input["id"];
  if (!isText(id) || id === "") return `${where}: нет идентификатора`;

  const field = input["field"];
  const kind = input["kind"];

  if (kind !== "presence") {
    if (!isText(field) || !isFieldRef(field)) {
      return `${where}: ссылка на поле должна быть путём вида «/имя» (JSON Pointer)`;
    }
  }

  switch (kind) {
    case "compare": {
      const operator = input["operator"];
      const value = input["value"];
      if (!isText(operator) || !OPERATORS.has(operator)) {
        return `${where}: неизвестный оператор «${String(operator)}»`;
      }
      if (!isText(value)) return `${where}: значение должно быть строкой`;
      const sensitive = input["sensitive"];
      if (sensitive !== undefined && typeof sensitive !== "boolean") {
        return `${where}: признак регистра должен быть логическим`;
      }
      return {
        id,
        kind: "compare",
        field: field as string,
        operator: operator as ComparisonOperator,
        value,
        ...(sensitive === true ? { sensitive: true } : {}),
      };
    }
    case "in": {
      const values = input["values"];
      if (!isTextList(values)) return `${where}: список значений должен быть массивом строк`;
      return { id, kind: "in", field: field as string, values: [...values] };
    }
    case "between": {
      const from = input["from"];
      const to = input["to"];
      if (!isText(from) || !isText(to)) return `${where}: границы диапазона должны быть строками`;
      return { id, kind: "between", field: field as string, from, to };
    }
    case "presence": {
      const mode = input["mode"];
      const quantifier = input["quantifier"];
      const fields = input["fields"];
      if (!isText(mode) || !MODES.has(mode)) return `${where}: неизвестный вид проверки наличия`;
      if (!isText(quantifier) || !QUANTIFIERS.has(quantifier)) return `${where}: неизвестный квантор`;
      if (!isTextList(fields)) return `${where}: поля должны быть массивом строк`;
      const broken = fields.find((item) => !isFieldRef(item));
      if (broken !== undefined) {
        return `${where}: ссылка на поле «${broken}» должна быть путём вида «/имя» (JSON Pointer)`;
      }
      return {
        id,
        kind: "presence",
        mode: mode as PresenceMode,
        quantifier: quantifier as Quantifier,
        fields: [...fields],
      };
    }
    default:
      return `${where}: неизвестный вид «${String(kind)}»`;
  }
}

/**
 * Прочитать состояние из чужих данных.
 *
 * Ошибка — строкой с адресом («условие №2: неизвестный оператор»), а не исключением: это
 * граница модуля, и по ту сторону может лежать что угодно.
 */
export function parseFilter(input: unknown): ParsedFilter {
  if (!isObject(input)) return { ok: false, error: "фильтр должен быть объектом" };

  const version = input["version"];
  if (version !== FILTER_FORMAT_VERSION) {
    return {
      ok: false,
      error:
        version === undefined
          ? "у фильтра нет версии формата — прочитать его нечем"
          : `версия формата ${String(version)} не поддерживается, нужна ${FILTER_FORMAT_VERSION}`,
    };
  }

  const rawConditions = input["conditions"];
  if (!Array.isArray(rawConditions)) return { ok: false, error: "условия должны быть массивом" };

  const conditions: Condition[] = [];
  const seen = new Set<string>();

  for (const [index, raw] of rawConditions.entries()) {
    const condition = parseCondition(raw, index);
    if (typeof condition === "string") return { ok: false, error: condition };
    if (seen.has(condition.id)) {
      return { ok: false, error: `идентификатор условия «${condition.id}» встречается дважды` };
    }
    seen.add(condition.id);
    conditions.push(condition);
  }

  const rawLogic = input["logic"];
  if (!isObject(rawLogic)) return { ok: false, error: "логика должна быть объектом" };

  let logic: Logic;
  if (rawLogic["mode"] === "all") {
    logic = { mode: "all" };
  } else if (rawLogic["mode"] === "formula") {
    const expr = parseExpr(rawLogic["expr"], "логика");
    if (typeof expr === "string") return { ok: false, error: expr };
    const dangling = danglingIds(expr, [...seen]);
    if (dangling.length > 0) {
      return {
        ok: false,
        error: `логика ссылается на условия, которых нет: ${dangling.join(", ")}`,
      };
    }
    logic = { mode: "formula", expr };
  } else {
    return { ok: false, error: `неизвестный режим логики «${String(rawLogic["mode"])}»` };
  }

  // Счётчик идентификаторов двигаем за прочитанные: иначе следующее добавленное условие
  // получит имя, уже занятое пришедшим извне, и правка одного меняла бы другое.
  reserveConditionIds(seen);

  return { ok: true, state: { version: FILTER_FORMAT_VERSION, conditions, logic } };
}

/**
 * Отдать состояние наружу.
 *
 * Состояние и так чистые данные, поэтому функция короткая — но она ЕСТЬ, потому что форма
 * выдачи это контракт: пройдёт ли она обратно через `parseFilter`, проверяется пробой, а не
 * надеждой на то, что структуру никто не менял.
 */
export function serializeFilter(state: FilterState): FilterState {
  return JSON.parse(JSON.stringify(state)) as FilterState;
}
