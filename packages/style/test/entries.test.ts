import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import * as root from "../src/index.js";

// ВХОД ОДИН. Их было два: корень и `/values` — подпуть без реактивной части (`PWEB-44`).
// Реактивной части не стало (`PWEB-56`), корень совпал с подпутём имя в имя, и подпуть снят:
// две двери к одному и тому же — второй источник правды, а не удобство.
//
// Здесь остался гейт, ради которого подпуть и заводился, — ОБЕЩАНИЕ, что вход не тянет чужого.
// Оно пережило дверь и держится теперь на корне: `solid-js` не импортирует ни один исходник,
// не объявлен ни одним видом зависимости, и обход собранного графа не выходит за поставку.
//
// Раздел про совпадение дверей снят вместе с дверью: сторожить нечего. Что подпутя больше нет,
// проверяет `pack.test.ts` — там это видно на настоящей установке, а не на исходниках.
//
// Ниже есть ВТОРОЙ раздел, и он не про двери. Снимая первый, я прогнал мутацию «дописать
// экспорт прямо в `src/index.ts`» — и она прошла зелёной. Так выяснилось, что тот раздел
// сторожил два разных обещания сразу: совпадение дверей (умерло вместе с подпутём) и
// «перечень поверхности живёт в ОДНОМ месте» (живее прежнего — это единственная оставшаяся
// роль `src/values.ts`). Второе вернул отдельной пробой: обязательство без гейта — это
// обещание, а зона такими не держится.

const srcRoot = resolve(import.meta.dirname, "..", "src");

/** Все файлы исходников зоны, рекурсивно. */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sources(path);
    return entry.name.endsWith(".ts") ? [path] : [];
  });
}

describe("Solid зоне не нужен", () => {
  it("`solid-js` не импортирует ни один исходник", () => {
    // Его трогал ровно один файл — реактивный контроллер темы, — и файла больше нет.
    // Появится второй импорт — вернётся и одноранговая зависимость у каждого потребителя.
    const guilty = sources(srcRoot).filter((path) =>
      /from\s+"solid-js/.test(readFileSync(path, "utf8")),
    );

    expect(guilty.map((path) => path.slice(srcRoot.length + 1))).toEqual([]);
  });

  it("`solid-js` не объявлен в манифесте ни одним видом зависимости", () => {
    // Снятая зависимость, оставшаяся в манифесте, — это счёт, который платит каждый
    // потребитель: pnpm доставляет одноранговые сам.
    const manifest = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "package.json"), "utf8"),
    ) as Record<string, Record<string, unknown> | undefined>;

    for (const kind of ["dependencies", "peerDependencies", "peerDependenciesMeta", "devDependencies"]) {
      expect(manifest[kind] ?? {}, `${kind} всё ещё называет solid-js`).not.toHaveProperty(
        "solid-js",
      );
    }
  });

  it("из собранного входа не дойти ни до одного чужого модуля", () => {
    // Обходим ФАКТИЧЕСКИЙ граф поставки, а не исходники: `dist` — это то, что уедет
    // потребителю. Гейт срабатывает до упаковки, поэтому «случайно затянули чужое» краснеет
    // на обычном прогоне, а не на чистой установке.
    const dist = resolve(import.meta.dirname, "..", "dist");
    const seen = new Set<string>();
    const foreign = new Set<string>();

    const walk = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);

      const code = readFileSync(file, "utf8");
      for (const [, specifier] of code.matchAll(/from\s+"([^"]+)"/g)) {
        if (specifier.startsWith(".")) walk(resolve(join(file, ".."), specifier));
        else foreign.add(specifier);
      }
    };

    walk(join(dist, "index.js"));
    walk(join(dist, "values.js"));

    expect(seen.size, "обход не нашёл ни одного модуля — путь к `dist` сломан").toBeGreaterThan(5);
    expect([...foreign], "вход тянет чужой модуль").toEqual([]);
  });
});

describe("перечень поверхности — в одном месте", () => {
  it("в корне ровно один реэкспорт и больше НИЧЕГО", () => {
    // Единственная оставшаяся роль `src/values.ts` — быть перечнем того, что зона обещает.
    // Экспорт, дописанный прямо в корень, эту роль отменяет молча: имя окажется на поверхности,
    // а в перечне его не будет, и «что мы обещали» придётся собирать по двум файлам.
    //
    // СМОТРИМ ФАЙЛ ЦЕЛИКОМ, а не его импорты. Дописать экспорт можно тремя способами, и
    // перечень источников ловит только два из них:
    //
    //   export { X } from "./другое.js";              — есть `from`, поймано;
    //   import { X } from "./другое.js"; export { X }; — `from` на строке импорта, поймано;
    //   export const X = …;                            — `from` НЕТ ВОВСЕ, проходило зелёным.
    //
    // Третий способ и есть самый вероятный: имя, объявленное «тут же, по мелочи». Поэтому
    // разрешено ровно одно содержимое файла, и любое четвёртое написание краснеет само, не
    // будучи перечисленным.
    //
    // ТЕКСТОМ, А НЕ РАНТАЙМОМ: экспорт одного ТИПА сверка значений пропустила бы — типов в
    // рантайме нет.
    const body = readFileSync(join(srcRoot, "index.ts"), "utf8")
      .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    expect(body).toEqual(['export * from "./values.js";']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────
// ПОВЕРХНОСТЬ ЗОНЫ, ПЕРЕЧНЕМ. Пробел найден мутацией архитектора: `export const SHADOWS = {…}`
// в `src/values.ts` прошёл зелёным на всех 225 пробах — значит решение «фреймворк не везёт
// готовых значений» не держалось ничем.
//
// СТОРОЖИТЬ РЕШЕНО НЕ «НАБОРЫ», А ПОВЕРХНОСТЬ ЦЕЛИКОМ, и это не расширение задачи, а
// единственная форма, которая работает. Сторож «готовых значений не отдаём» потребовал бы
// определить, что такое готовое значение, — то есть перечислить ЗАПРЕЩЁННЫЕ формы. Тени взяты
// наугад, вернуться может что угодно: ряд длительностей, набор теней, таблица отступов,
// «рекомендованные» шрифты. Перечень запрещённого устареет на первом же новом наборе.
//
// Перечень РАЗРЕШЁННОГО не устаревает: в нём ровно то, что зона обещает сегодня, и любое
// сорок девятое имя краснеет само, какой бы формы оно ни было. Заодно ловится и обратное —
// тихая пропажа имени с поверхности, а после стольких снятий это не теоретическая опасность.
//
// Перечень ведётся руками, и это цена, названная вслух: добавить экспорт стало нельзя молча.
// Ровно этого и добивались — поверхность замерзает выпуском, и её расширение обязано быть
// решением, а не побочкой правки.
//
// РЯДОМ С КАЖДОЙ ГРУППОЙ НАЗВАН ЖИВОЙ ЗОВУЩИЙ. Имя без зовущего — кандидат на снятие, и
// перечень тем и полезен, что делает это видимым в одном месте.

/** Значения, которые зона отдаёт наружу. */
const VALUES: readonly string[] = [
  // Построение половины шкалы из семени — `packages/skin/src/seeds.ts`.
  "buildScale", "buildAlphaScale", "buildChartScale", "buildScrim",
  "CONTRAST_PROMISES", "NO_PROMISE", "SCALE_STEPS", "STEP_PURPOSE", "CHART_SLOTS",
  // Форма размерных шкал — `packages/skin/src/sizes.ts`.
  "DERIVED_SCALES", "DERIVED_TOKENS", "FIXED_TOKENS",
  "DENSITY_TOKEN", "DENSITY_DEFAULT", "DENSITY_FLOOR", "DENSITY_CEILING", "DENSITY_NOTE",
  "GRID_STEP", "GRID_NOTE", "ROUND_SUPPORT_TEST", "ROUND_FALLBACK_NOTE",
  // Границы осей — зовущего пока нет, оставлены решением: знание нужно строящему ползунок.
  "AXES", "axisOf",
  // Порядок перекрытия — зовущего нет; перечень имён, не механизм.
  "LAYERS", "LAYER_TOKENS",
  // Гейт контраста и разбор цвета — `packages/skin/src/contrast.ts`.
  "contrastRatio", "AA_TEXT", "AA_NON_TEXT",
  "parseColor", "tryParseColor", "NAMED_COLORS", "NAMED_COLOR_COUNT",
  // Цветовая математика — своя, потому что шкалы считаются здесь.
  "formatOklch", "inSrgbGamut", "oklchToSrgb", "srgbToOklch", "toSrgbGamut",
  // Приезд базы — скелет `starter`, эталон, пробы `runtime`.
  "BASE_MARKER",
];

/** Типы. В рантайме их нет, поэтому сверяются отдельно — по тексту перечня. */
const TYPES: readonly string[] = [
  "ScaleMode", "ScaleKey", "ScaleValues", "ScaleStep", "AlphaKey", "AlphaValues",
  "ContrastPromise", "DerivedScale", "DerivedStep", "Axis", "AxisBound", "BoundKind",
  "Layer", "Oklch", "Srgb", "ColorRefusal", "ParsedColor", "BaseMarker",
];

describe("поверхность зоны — перечень разрешённого", () => {
  it("наружу торчит РОВНО объявленный перечень значений", () => {
    // Смотрим СОБРАННЫЙ вход, а не исходник: уезжает потребителю он.
    expect(Object.keys(root).sort()).toEqual([...VALUES].sort());
  });

  it("перечень значений и типов совпадает с тем, что объявляет `values.ts`", () => {
    // Вторая сторона, и она про ТИПЫ: в рантайме их нет, проверка выше их не видит вовсе.
    // Тип-набор («рекомендованные тени как тип») прошёл бы мимо первой пробы.
    const source = readFileSync(join(srcRoot, "values.ts"), "utf8").replace(
      /\/\/[^\n]*|\/\*[\s\S]*?\*\//g,
      "",
    );
    const declared = [...source.matchAll(/export \{([^}]*)\} from/g)]
      .flatMap((match) => match[1].split(","))
      .map((piece) => piece.trim().replace(/^type\s+/, ""))
      .filter(Boolean);

    expect(declared.sort()).toEqual([...VALUES, ...TYPES].sort());
  });

  it("`values.ts` состоит ТОЛЬКО из реэкспортов — своих объявлений в нём нет", () => {
    // Третья сторона, и без неё сторож дырявый: мутация показала, что набор, объявленный ТИПОМ
    // прямо здесь (`export type Shadows = {…}`), проходил обе пробы выше. Рантайм типов не
    // видит, а разбор перечня смотрел только блоки `export { … } from`.
    //
    // Форма закрывает это разом и не перечнем запрещённого: перечень поверхности — СПИСОК, а не
    // место, где что-то объявляют. Любое своё объявление, какой бы формы оно ни было, ломает
    // форму файла и краснеет, не будучи названным.
    const body = readFileSync(join(srcRoot, "values.ts"), "utf8")
      .replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "")
      .replace(/export \{[^}]*\} from "[^"]+";/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    expect(body, "в перечне поверхности появилось собственное объявление").toEqual([]);
  });

  it("перечень не пуст и не выродился — проба смотрит на настоящую поверхность", () => {
    // Без этого «перечни совпали» было бы истиной и на пустой зоне.
    expect(VALUES.length).toBeGreaterThan(30);
    expect(TYPES.length).toBeGreaterThan(10);
    expect(new Set([...VALUES, ...TYPES]).size, "имя в перечне дважды").toBe(
      VALUES.length + TYPES.length,
    );
  });
});
