// ТРЁХЗНАЧНАЯ логика фильтра: истина · ложь · неизвестно.
//
// Взята как канон SQL-семьи, а не изобретена. Сверено с фондом `canons/filter-tables-graphs`
// 2026-08-11 по двум независимым первичным источникам, обе выписки прошли ручную сверку:
//
//   • OGC CQL2 (21-065r2) §6.2, Table 2 и §6.6, Table 3 — «A predicate is an expression that
//     evaluates to the Boolean values of TRUE or FALSE or that evaluates to the value NULL
//     when dealing with unknown values»;
//   • PostgreSQL, Logical Operators — «SQL uses a three-valued logic system with true, false,
//     and null, which represents "unknown"».
//
// ЗАЧЕМ ЭТО НАМ, а не «как у больших». По плану (`TABLES-2`) вычислитель однажды
// заменяется трансляцией запроса к бэку. Бэк — SQL-семьи. Двузначный фронт и трёхзначный бэк
// на ОДНОМ И ТОМ ЖЕ сохранённом фильтре вернут разные строки, и разойдутся они на отрицаниях
// и на неполных данных — то есть ровно на опорном кейсе волны, где состав полей у объектов
// разный. Решение user 2026-08-11, разбор — `TABLES-4`, раздел A.
//
// На экране трёхзначности НЕТ: пользователь видит «строка показана / не показана». Третье
// значение живёт внутри и всплывает наружу только счётчиком «неизвестно» у условия.

/** Значение предиката: `true` · `false` · `null` = неизвестно (SQL `unknown`). */
export type Truth = boolean | null;

/** Неизвестно — именованная константа, чтобы `null` в коде читался, а не угадывался. */
export const UNKNOWN: Truth = null;

/**
 * Конъюнкция по Table 2 CQL2.
 *
 * Ключевое, ради чего таблица и нужна: `FALSE AND NULL = FALSE`, а не `NULL` — ложь ПОГЛОЩАЕТ
 * неизвестное. Наивное «есть null → результат null» здесь соврало бы.
 */
export function and(a: Truth, b: Truth): Truth {
  if (a === false || b === false) return false;
  if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN;
  return true;
}

/** Дизъюнкция по Table 2 CQL2: `TRUE OR NULL = TRUE` — истина поглощает неизвестное. */
export function or(a: Truth, b: Truth): Truth {
  if (a === true || b === true) return true;
  if (a === UNKNOWN || b === UNKNOWN) return UNKNOWN;
  return false;
}

/**
 * Отрицание по Table 3 CQL2: `NOT NULL = NULL`.
 *
 * Здесь и было наше расхождение до 2026-08-11: обычное `!` превращало неизвестное в истину,
 * и строка без поля проходила условие `НЕ («phone» равно «+7»)`. По канону — не проходит.
 */
export function not(a: Truth): Truth {
  return a === UNKNOWN ? UNKNOWN : !a;
}

/**
 * Пропускает ли ОТБОР строку с таким значением предиката.
 *
 * Только `TRUE`. Правило не из таблицы истинности, а из раздела о `WHERE`: строка попадает в
 * выборку, когда условие истинно, — «неизвестно» не проходит наравне с ложью.
 */
export function passes(value: Truth): boolean {
  return value === true;
}
