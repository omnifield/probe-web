// Вид таблицы → хвост запроса: порядок и страница.
//
// Пара к `filters/sql.ts`: там условие отбора, здесь то, что к нему добавляет таблица. Разделено
// по модулям, а не свалено в один: фильтры уедут отдельным продуктом, и знание про `ViewState`
// утащило бы за ними лишнее.
//
// Сегодня и отбор, и порядок, и страница считаются НА КЛИЕНТЕ — весь набор лежит в памяти. Этот
// текст нужен не для того, чтобы их туда унести, а чтобы бэк увидел, что мы пришлём, когда
// унесём. Разница названа прямо в оговорках: на сервере смещение станет хрупким, а тай-брейкер
// придётся взять из ключа таблицы.

import { sqlColumn, type SqlDialect } from "../filters/index.js";
import type { SessionState, ViewState } from "./model.js";

export interface ViewSqlOptions {
  dialect?: SqlDialect;
}

export interface ViewSql {
  /** `ORDER BY …`; пусто — сортировки нет. */
  order: string;
  /** `LIMIT … OFFSET …`; пусто — листания нет. */
  page: string;
  notes: string[];
}

/**
 * Порядок и страница из состояния вида.
 *
 * @param view вид: ключи сортировки и размер страницы
 * @param session сеанс: на какой странице стоим
 */
export function viewToSql(
  view: ViewState,
  session: SessionState,
  options: ViewSqlOptions = {},
): ViewSql {
  const dialect = options.dialect ?? "standard";
  const notes: string[] = [];

  const keys = view.sorting.map((rule) => {
    const column = sqlColumn(rule.field, dialect);
    // Пустое значение больше любого непустого (PostgreSQL: «null values sort as if larger»).
    // Пишем явно: умолчание совпадает не у всех СУБД, а порядок — это то, что человек видит.
    return rule.direction === "desc"
      ? `${column} DESC NULLS FIRST`
      : `${column} ASC NULLS LAST`;
  });

  if (keys.length > 0) {
    notes.push(
      "Порядок обязан быть ПОЛНЫМ: у нас последним ключом идёт тождество строки, на сервере им должен стать ключ таблицы — иначе равные строки скачут между страницами.",
    );
  }

  const page =
    view.pageSize === null
      ? ""
      : `LIMIT ${view.pageSize} OFFSET ${session.page * view.pageSize}`;

  if (page !== "") {
    notes.push(
      "Листание смещением честно, пока набор не меняется под руками. На сервере при вставках выше страницы оно разъедется — там нужен курсор (AIP-158), и это отдельный разговор.",
    );
  }

  return { order: keys.length === 0 ? "" : `ORDER BY ${keys.join(", ")}`, page, notes };
}
