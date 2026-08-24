// Сравнение значений для сортировки.
//
// Две вещи взяты у канона SQL и обе с ценой, названной вслух (сверка 2026-08-11,
// `TABLES-5`):
//
// 1. **Пустое значение больше любого непустого.** PostgreSQL: «By default, null values sort as
//    if larger than any non-null value; that is, NULLS FIRST is the default for DESC order, and
//    NULLS LAST otherwise». Мы сравниваем ПО ВОЗРАСТАНИЮ, а разворот для убывания делает
//    движок — значит одно это правило даёт оба умолчания SQL сразу, без отдельной ветки.
//
// 2. **Порядок обязан быть ПОЛНЫМ.** Устойчивость сортировки рынком не требуется: SQL прямо
//    снимает гарантию для строк, равных по ключам («A particular output ordering can only be
//    guaranteed if the sort step is explicitly chosen»). Поэтому в конец списка ключей всегда
//    добавляется тождество строки — иначе равные строки скакали бы местами при каждой
//    пересортировке, и пользователь читал бы это как «данные прыгают».

import type { FieldType } from "./model.js";

const DATE_DMY = /^(\d{2})\.(\d{2})\.(\d{4})$/;

/** Значение, которое сравнивать не с чем: отсутствует, пусто или не разбирается по типу. */
function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim());
  return Number.isNaN(parsed) ? null : parsed;
}

function asTime(value: unknown): number | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.getTime();
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const text = value.trim();
  const dmy = DATE_DMY.exec(text);
  const parsed = dmy ? Date.parse(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`) : Date.parse(text);
  return Number.isNaN(parsed) ? null : parsed;
}

function asBool(value: unknown): number | null {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (["true", "да", "1", "yes"].includes(text)) return 1;
    if (["false", "нет", "0", "no"].includes(text)) return 0;
  }
  return null;
}

/**
 * Сравнить два значения ПО ВОЗРАСТАНИЮ.
 *
 * Значение, которое не разбирается по типу колонки, попадает в ту же корзину, что и пустое, —
 * в конец. Притворяться, что «вчера» это дата, а «много» это число, значит расставить строки
 * в порядке, которого никто не просил.
 */
export function compareValues(
  a: unknown,
  b: unknown,
  type: FieldType,
  locale = "ru-RU",
): number {
  const blankA = isBlank(a);
  const blankB = isBlank(b);
  if (blankA && blankB) return 0;
  if (blankA) return 1;
  if (blankB) return -1;

  switch (type) {
    case "number":
    case "date": {
      const parse = type === "number" ? asNumber : asTime;
      const left = parse(a);
      const right = parse(b);
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    }
    case "bool": {
      const left = asBool(a);
      const right = asBool(b);
      if (left === null && right === null) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return left - right;
    }
    case "text":
      // Сравнение с учётом языка: «ё» между «е» и «ж», а не в конце алфавита.
      return String(a).localeCompare(String(b), locale);
  }
}
