// см. README.md / FAQ.md — JSON Pointer через `fast-json-patch`, не свой парсер; только дефолтный импорт (см. FAQ.md).
import jsonpatch from "fast-json-patch";

const { escapePathComponent, getValueByPointer, unescapePathComponent } = jsonpatch;

/** Ссылка на значение — JSON Pointer: `/a/b/0`, пустая строка — сами данные целиком. */
export type FieldRef = string;

export interface Lookup {
  readonly found: boolean;
  readonly value: unknown;
}

/** Найти значение по пути. Не найдено (путь мимо, узел не объект, индекс вне массива) — `found: false`. */
export function lookup(source: unknown, pointer: FieldRef): Lookup {
  if (pointer === "") return { found: true, value: source };

  let value: unknown;
  try {
    value = getValueByPointer(source, pointer);
  } catch {
    // см. FAQ.md — асимметрия библиотеки на промахе глубже первого сегмента выровнена здесь.
    return { found: false, value: undefined };
  }

  return { found: value !== undefined, value };
}

function tokens(pointer: FieldRef): string[] {
  return pointer === "" ? [] : pointer.slice(1).split("/").map(unescapePathComponent);
}

/** Положить значение по пути, достраивая вложенность. МУТИРУЕТ `row` — см. FAQ.md. */
export function assign(row: Record<string, unknown>, pointer: FieldRef, value: unknown): Record<string, unknown> {
  const path = tokens(pointer);
  if (path.length === 0) return row;

  let cursor: Record<string, unknown> = row;
  for (const [index, token] of path.entries()) {
    if (index === path.length - 1) {
      cursor[token] = value;
      break;
    }

    const inner = cursor[token];
    const branch =
      typeof inner === "object" && inner !== null && !Array.isArray(inner)
        ? (inner as Record<string, unknown>)
        : {};

    cursor[token] = branch;
    cursor = branch;
  }

  return row;
}

/** Собрать путь из сегментов с экранированием — обратная сторона разбора. */
export function pointerOf(path: readonly string[]): FieldRef {
  return path.map((name) => `/${escapePathComponent(name)}`).join("");
}

/** Перечислить пути, которые есть в образце данных (для отчёта о непойманных чужих полях). */
export function discoverPaths(sample: unknown, depth = 6): FieldRef[] {
  const found: FieldRef[] = [];

  const walk = (value: unknown, path: string[], left: number): void => {
    if (left === 0) return;

    if (Array.isArray(value)) {
      if (value.length > 0) walk(value[0], [...path, "0"], left - 1);
      return;
    }

    if (typeof value === "object" && value !== null) {
      for (const [key, inner] of Object.entries(value)) {
        const next = [...path, key];
        found.push(pointerOf(next));
        walk(inner, next, left - 1);
      }
    }
  };

  walk(sample, [], depth);
  return found;
}
