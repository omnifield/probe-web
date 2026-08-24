// Ссылка на поле — ПУТЬ в форме JSON Pointer (RFC 6901), а не плоское имя.
//
// Почему путь. Опорный кейс волны — массив объектов с разным составом полей; в живых данных
// это почти всегда вложенность (`заявитель.имя`). Плоское имя такое поле не адресует вовсе.
//
// Почему именно JSON Pointer, а не точечная нотация MongoDB. Сверено с фондом 2026-08-11
// (`TABLES-4`, раздел D): у точечной нотации нет механизма экранирования — имя поля с
// точкой внутри адресуемо неоднозначно, и разделитель пути не отличить от индекса массива.
// RFC 6901 этот конфликт закрывает: `/` внутри имени пишется `~1`, `~` пишется `~0`, а
// раскодирование идёт СТРОГО в порядке `~1`→`/`, потом `~0`→`~`, иначе `~01` сломается.
//
// JSONPath (RFC 9535) не берём сознательно: он выбирает МНОЖЕСТВО узлов, а условию фильтра
// нужен ровно один. Множественность — это уже язык запроса, слоем выше.

/** Строка данных: набор полей, у разных строк — разный. */
export type Row = Record<string, unknown>;

/** Ссылка на поле: JSON Pointer, например `/phone` или `/contact/phone`. */
export type FieldRef = string;

/** Результат обхода: найден ли узел и что в нём лежит. */
export interface Lookup {
  /** Узел ЕСТЬ — независимо от того, что в нём лежит (в т.ч. `null`). */
  found: boolean;
  value: unknown;
}

const NOT_FOUND: Lookup = { found: false, value: undefined };

/**
 * Разобрать указатель на токены.
 *
 * @returns токены пути или `null`, если строка указателем не является
 */
export function parsePointer(pointer: FieldRef): string[] | null {
  if (pointer === "") return [];
  if (!pointer.startsWith("/")) return null;

  return pointer
    .slice(1)
    .split("/")
    .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
}

/** Указатель ли это по форме RFC 6901. Пустая строка — валидный указатель на всю строку. */
export function isFieldRef(pointer: string): boolean {
  return parsePointer(pointer) !== null;
}

/** Собрать указатель из имён полей — экранирование в обратном порядке: сначала `~`, потом `/`. */
export function toFieldRef(path: readonly string[]): FieldRef {
  return path.map((name) => `/${name.replaceAll("~", "~0").replaceAll("/", "~1")}`).join("");
}

function arrayIndex(token: string): number | null {
  // Ведущих нулей быть не должно (§4): `01` — не индекс. Токен `-` указывает на элемент ЗА
  // последним, которого не существует, — для чтения это всегда промах.
  if (!/^(0|[1-9][0-9]*)$/.test(token)) return null;
  return Number(token);
}

/**
 * Пройти по указателю и сказать, есть ли узел и что в нём.
 *
 * Отсутствие узла и `null` в узле РАЗВЕДЕНЫ: это разные вещи и для трёхзначной логики
 * (`found: false` → неизвестно), и для условия по наличию поля.
 */
export function lookup(row: Row, pointer: FieldRef): Lookup {
  const tokens = parsePointer(pointer);
  if (tokens === null) return NOT_FOUND;

  let current: unknown = row;

  for (const token of tokens) {
    if (Array.isArray(current)) {
      const index = arrayIndex(token);
      if (index === null || index >= current.length) return NOT_FOUND;
      current = current[index];
      continue;
    }

    if (typeof current === "object" && current !== null) {
      if (!Object.hasOwn(current, token)) return NOT_FOUND;
      current = (current as Record<string, unknown>)[token];
      continue;
    }

    return NOT_FOUND;
  }

  return { found: true, value: current };
}

/** Поле ЕСТЬ у строки — независимо от того, что в нём лежит. */
export function hasField(row: Row, field: FieldRef): boolean {
  return lookup(row, field).found;
}

/**
 * Поле есть И заполнено.
 *
 * НАШЕ решение, рынком не подтверждённое (`TABLES-4`, раздел G): protobuf нормирует
 * присутствие как «задано / не задано» и прямо говорит, что отдельного «пустого скаляра» у
 * него нет. Мы держим три состояния, потому что опорный кейс волны — про наличие полей.
 *
 * Пусто: `null`, `undefined`, пустая строка, строка из пробелов, пустой массив.
 * ЦЕНА, принятая сознательно: легитимно пустая строка неотличима от незаполненного поля.
 */
export function isFilled(row: Row, field: FieldRef): boolean {
  const found = lookup(row, field);
  if (!found.found) return false;

  const value = found.value;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
