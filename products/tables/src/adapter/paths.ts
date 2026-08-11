// Пути: обход чужих данных и сборка наших.
//
// Читаем чужое той же ссылкой-путём (JSON Pointer), что и своё, — второго синтаксиса на входе
// заводить незачем. Кладём в наш канон здесь же: собрать значение по пути умеет только
// адаптер, потому что больше никто у нас ничего не собирает — представления только читают.

import { isFieldRef, lookup, type Row } from "../filters/index.js";
import type { FieldRef } from "../dataset/index.js";

export { isFieldRef, lookup };

function tokens(pointer: FieldRef): string[] {
  return pointer === ""
    ? []
    : pointer
        .slice(1)
        .split("/")
        .map((token) => token.replaceAll("~1", "/").replaceAll("~0", "~"));
}

/**
 * Положить значение в строку по пути, достраивая вложенность.
 *
 * Строка собирается НОВАЯ на каждый вызов — чужие данные мы не трогаем: адаптер обязан быть
 * читателем источника, иначе он однажды поправит то, что ему дали посмотреть.
 */
export function assign(row: Row, pointer: FieldRef, value: unknown): Row {
  const path = tokens(pointer);
  if (path.length === 0) return row;

  const next: Row = { ...row };
  let cursor: Record<string, unknown> = next;

  for (const [index, token] of path.entries()) {
    if (index === path.length - 1) {
      cursor[token] = value;
      break;
    }

    const inner = cursor[token];
    // Ветку достраиваем, но чужое значение по дороге не затираем молча: если на месте узла
    // лежит не объект, путь просто не проходит — и это увидит отчёт, а не пользователь потом.
    const branch = typeof inner === "object" && inner !== null && !Array.isArray(inner)
      ? { ...(inner as Record<string, unknown>) }
      : {};

    cursor[token] = branch;
    cursor = branch;
  }

  return next;
}

/** Собрать путь из имён с экранированием — обратная сторона разбора. */
export function pointerOf(path: readonly string[]): FieldRef {
  return path.map((name) => `/${name.replaceAll("~", "~0").replaceAll("/", "~1")}`).join("");
}

/**
 * Перечислить пути, которые ЕСТЬ в образце их данных.
 *
 * Это то, что делает перемап работой мышкой: конструктор показывает готовый список путей
 * источника, а не ждёт, что человек наберёт `/data/items/0/client_name` без опечатки.
 *
 * @param depth предел вложенности — защита от самоссылающихся и просто огромных ответов
 */
export function discoverPaths(sample: unknown, depth = 6): FieldRef[] {
  const found: FieldRef[] = [];

  const walk = (value: unknown, path: string[], left: number): void => {
    if (left === 0) return;

    if (Array.isArray(value)) {
      // У массива смотрим ПЕРВЫЙ элемент: строки набора однородны, и перечислять пути каждой
      // значило бы показать человеку тысячу одинаковых.
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

/** Пути ВНУТРИ строки набора — то, из чего собираются правила полей. */
export function discoverRowPaths(input: unknown, rows: FieldRef, depth = 6): FieldRef[] {
  const found = lookup(input as Row, rows);
  const set = found.found ? found.value : input;
  const first = Array.isArray(set) ? set[0] : set;
  return first === undefined ? [] : discoverPaths(first, depth);
}

/**
 * Найти в ответе места, похожие на набор строк.
 *
 * Нужно ровно затем же, зачем список путей: заворачивают все по-разному, и угадывать
 * `/data/items` руками — самая частая ошибка при настройке.
 */
export function discoverRowSets(input: unknown, depth = 4): FieldRef[] {
  const found: FieldRef[] = [];

  const walk = (value: unknown, path: string[], left: number): void => {
    if (left === 0) return;

    if (Array.isArray(value)) {
      const first = value[0];
      if (typeof first === "object" && first !== null && !Array.isArray(first)) {
        found.push(pointerOf(path));
      }
      return;
    }

    if (typeof value === "object" && value !== null) {
      for (const [key, inner] of Object.entries(value)) walk(inner, [...path, key], left - 1);
    }
  };

  walk(input, [], depth);
  return found;
}
