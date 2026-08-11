// Показ значения. Формат — ВИЗУАЛ, поэтому здесь только текст и машинные зацепки; ни одного
// класса и ни одного нарисованного элемента: кит безголовый (`kb:PROBEWEB-4`).
//
// Отсюда же ответ на «рейтинг»: мы отдаём число и `data-rating`/`data-rating-max`, а звёзды
// рисует потребитель своим CSS. Привези мы звёзды сами — база стала бы непоследовательной:
// половина безголовая, половина оформленная.

import { type FormatKind, formatOf, type Presentable } from "./spec.js";

/** Что получилось: текст в ячейку и атрибуты-зацепки к ней. */
export interface Formatted {
  text: string;
  attrs: Record<string, string>;
}

/** Язык показа по умолчанию. Меняется свойством таблицы, а не правкой этого файла. */
export const DEFAULT_LOCALE = "ru-RU";

const DATE_DMY = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") return new Date(value);
  if (typeof value !== "string") return null;

  const text = value.trim();
  if (text === "") return null;

  const dmy = DATE_DMY.exec(text);
  const parsed = dmy ? Date.parse(`${dmy[3]}-${dmy[2]}-${dmy[1]}T00:00:00Z`) : Date.parse(text);
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    if (["true", "да", "1", "yes"].includes(text)) return true;
    if (["false", "нет", "0", "no"].includes(text)) return false;
  }
  return null;
}

/**
 * Показать значение по формату колонки.
 *
 * Значение, которое по формату не разбирается, показывается КАК ЕСТЬ и помечается
 * `data-unformatted`. Соврать форматом («—», ноль, пустая ячейка) дешевле всего и хуже всего:
 * на экране это выглядит как настоящие данные.
 */
export function formatValue(
  value: unknown,
  field: Presentable,
  locale: string = DEFAULT_LOCALE,
): Formatted {
  const kind: FormatKind = formatOf(field);
  const options = field.formatOptions ?? {};

  if (value === null || value === undefined) return { text: "", attrs: {} };

  const raw = { text: String(value), attrs: { "data-unformatted": "" } };

  switch (kind) {
    case "text":
      return { text: String(value), attrs: {} };

    case "number": {
      const number = toNumber(value);
      if (number === null) return raw;
      return {
        text: new Intl.NumberFormat(locale, {
          maximumFractionDigits: options.fractionDigits ?? 2,
        }).format(number),
        attrs: { "data-value": String(number) },
      };
    }

    case "percent": {
      const number = toNumber(value);
      if (number === null) return raw;
      // Доля или сотые — не угадываем: `percentBase` объявляется колонкой.
      const fraction = (options.percentBase ?? "fraction") === "fraction" ? number : number / 100;
      return {
        text: new Intl.NumberFormat(locale, {
          style: "percent",
          maximumFractionDigits: options.fractionDigits ?? 0,
        }).format(fraction),
        attrs: { "data-value": String(fraction) },
      };
    }

    case "date":
    case "datetime": {
      const date = toDate(value);
      if (date === null) return raw;
      const shape: Intl.DateTimeFormatOptions =
        kind === "date"
          ? { day: "2-digit", month: "2-digit", year: "numeric" }
          : { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" };
      return {
        text: new Intl.DateTimeFormat(locale, { ...shape, timeZone: "UTC" }).format(date),
        // Машинная форма рядом с человеческой: по ней сортируют и её же читает разметка.
        attrs: { "data-value": date.toISOString() },
      };
    }

    case "bool": {
      const flag = toBool(value);
      if (flag === null) return raw;
      return { text: flag ? "да" : "нет", attrs: { "data-value": String(flag) } };
    }

    case "rating": {
      const number = toNumber(value);
      if (number === null) return raw;
      const max = options.ratingMax ?? 5;
      return {
        text: new Intl.NumberFormat(locale, {
          maximumFractionDigits: options.fractionDigits ?? 1,
        }).format(number),
        attrs: { "data-value": String(number), "data-rating": String(number), "data-rating-max": String(max) },
      };
    }
  }
}
