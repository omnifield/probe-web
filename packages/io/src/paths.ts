// ПУТИ — JSON Pointer (RFC 6901) через `fast-json-patch` (8.4M скачиваний/неделю, MIT,
// zero-dep, активно поддерживается), не своим парсером.
//
// ИСПРАВЛЕНО (2026-08-29, находка user): здесь раньше жила ТРЕТЬЯ независимая ручная реализация
// того же алгоритма (первые две — `packages/assembly/src/tree.ts`'s `resolveDataBinding`,
// `products/tables/src/adapter/paths.ts`, второй уже нет — снят вместе с адаптером). «Оставить
// как есть, это же 15 строк» было неверным решением: JSON — общая среда всего фреймворка, и
// копипаст парсера пути — системная проблема, не мелкий дубль. Правильный ответ — взять готовое:
// рынок закрывает ЧТЕНИЕ по пути (`getValueByPointer`) и низкоуровневое экранирование
// (`escapePathComponent`/`unescapePathComponent`, `~0`/`~1`) полностью.
//
// НЕ закрывает рынок (проверено, не предположено): ЗАПИСЬ с автодостройкой вложенности — RFC
// 6902 `add` нарочно требует, чтобы родитель уже существовал (это спецификация, не пробел
// библиотеки), и `fast-json-patch` этому следует. Первый кандидат на замену (`json-ptr`, умеет
// `set(..., force: true)`) оказался СНЯТ С ПОДДЕРЖКИ САМИМ npm — ВСЕ версии до последней
// помечены `deprecated` дженериковым «Package no longer supported», это признак отзыва пакета,
// не мейнтейнерского «используйте другое» — не берём, несмотря на то что API подходил идеально.
// Поэтому автодостройка (`assign`) и перечень путей образца (`discoverPaths`, отчёт о
// непойманных чужих полях) остаются СВОИМИ — не потому что искать было лень, а потому что здесь
// рынок либо не предлагает того же самого, либо предлагает ценой пакета с сомнительным статусом.
//
// `getValueByPointer` документированно (проверено запуском, не по описанию) бросает исключение
// НЕ на любом промахе, а только когда путь длиннее одного сегмента проходит через
// НЕСУЩЕСТВУЮЩЕЕ звено (`{}` → путь `/z/y` — `.y` на `undefined`), но тихо отдаёт `undefined` на
// промахе В ОДИН СЕГМЕНТ и на индексе мимо массива. Асимметрия самой библиотеки, не наша — здесь
// выровнена одним `try/catch`, других суждений об алгоритме этот файл не выносит.
//
// Тот же долг остаётся у `packages/assembly` — не эта зона, но то же исправление стоит сделать и
// там отдельным заходом (названо, не решено этим тикетом).

// НАЗВАННЫЙ импорт трёх функций отсюда не читается настоящим Node ESM (не бандлером — `tsc`
// эмитит импорт как есть, а рантайм-интероп CJS→ESM у Node статический, `cjs-module-lexer`):
// `escapePathComponent`/`unescapePathComponent` библиотека присваивает `exports.` напрямую и
// лексер их видит, а `getValueByPointer` попадает в `exports` только через `Object.assign(exports,
// core)` (`fast-json-patch/index.js`) — динамика, которую статический анализ не видит, и
// именованный импорт этого имени падает `ERR_MODULE_NOT_FOUND` под голым `node`, оставаясь
// незамеченным под Vite/Vitest (там интероп терпимее). ДЕФОЛТНЫЙ импорт работает всегда — это
// весь `module.exports` целиком, синтезированный интероп Node тут ни при чём.
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
    // Библиотека бросает на промахе через несуществующее звено ГЛУБЖЕ первого сегмента —
    // для нас это то же самое «не нашлось», что и её же тихий `undefined` на промахе в один
    // сегмент. JSON не хранит `undefined` как значение, поэтому обе причины неотличимы и не
    // обязаны различаться.
    return { found: false, value: undefined };
  }

  return { found: value !== undefined, value };
}

function tokens(pointer: FieldRef): string[] {
  return pointer === "" ? [] : pointer.slice(1).split("/").map(unescapePathComponent);
}

/**
 * Положить значение по пути, достраивая вложенность. МУТИРУЕТ `row` — вызывающий код передаёт
 * сюда только СВОЙ, уже скопированный аккумулятор (`field-rules.ts`'s `convertRecord` начинает с
 * `{}`/`{...source}`), не исходные чужие данные — их эта функция не видит вовсе.
 */
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

/**
 * Перечислить пути, которые ЕСТЬ в образце данных — то, из чего складывается отчёт о непойманных
 * чужих полях (`collectFieldRuleReport`). Обход дерева — СВОЙ (рынок не даёт готового «сплющить
 * произвольный объект в список JSON-путей» без веса отдельной библиотеки, см. шапку файла);
 * экранирование сегментов — библиотечное, через `pointerOf`.
 *
 * @param depth предел вложенности — защита от самоссылающихся и просто огромных записей
 */
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
