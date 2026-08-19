import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DENSITY_TOKEN, DERIVED_TOKENS, FIXED_TOKENS } from "../src/dimension.js";
import { LEGACY_TOKENS, ROLE_TOKENS } from "../src/roles.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// Инвариант base.css машиной, а не обещанием в шапке файла: базовый слой обязан
// РЕФЕРЕНСИТЬ тему, а не подменять её. Литеральный цвет здесь не переключается вместе с
// режимом и всплывает светлым пятном в тёмной странице.
//
// Проверяем ПОСТАВЛЯЕМЫЙ файл (`dist/css/base.css`), а не только ручной исходник: он
// собирается из исходника и трёх сгенерированных блоков, и инвариант обязан держаться на
// том, что уезжает потребителю.

const source = readFileSync(resolve(import.meta.dirname, "../src/css/base.css"), "utf8");
const built = readFileSync(resolve(import.meta.dirname, "../dist/css/base.css"), "utf8");

/** Тело файла без комментариев — иначе гейт спотыкается о примеры в тексте. */
const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("base.css", () => {
  it("не содержит литеральных цветов — ни в ручной части, ни в сгенерированной", () => {
    for (const [name, css] of [
      ["исходник", source],
      ["поставка", built],
    ] as const) {
      const literals = strip(css).match(/(oklch|rgba?|hsla?)\(|#[0-9a-fA-F]{3,8}\b/g);
      expect(literals, `цвет в базовом слое (${name}) не переключается темой`).toBeNull();
    }
  });

  it("каждый читаемый токен объявлен либо контрактом темы, либо этим же файлом", () => {
    const code = strip(built);
    const declared = new Set(
      [...code.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1].slice(2)),
    );
    const contract = new Set<string>([...SCALE_TOKENS, ...THEME_META_TOKENS]);

    const unknown = [...code.matchAll(/var\((--[\w-]+)/g)]
      .map((match) => match[1].slice(2))
      .filter((token) => !declared.has(token) && !contract.has(token));

    expect([...new Set(unknown)], "ссылка на токен вне контракта").toEqual([]);
  });

  it("объявляет `color-scheme` для обоих режимов — от него зависят системные элементы", () => {
    expect(strip(built)).toContain("color-scheme: light");
    expect(strip(built)).toContain("color-scheme: dark");
  });

  it("везёт все производные ступени, роли и устаревшие псевдонимы", () => {
    // Поставка собирается генератором: если блок не доехал, потребитель получит `base.css`
    // без половины контракта и узнает об этом по несработавшему `var()`.
    for (const token of [
      ...DERIVED_TOKENS,
      ...FIXED_TOKENS.map((item) => item.name),
      ...ROLE_TOKENS,
      ...LEGACY_TOKENS,
    ]) {
      expect(built, `токен --${token} не доехал в поставку`).toContain(`--${token}:`);
    }
  });

  it("шкалы производны от семени, а не выписаны значениями", () => {
    expect(built).toContain("--radius-lg: var(--radius, 0.5rem);");
    expect(built).toMatch(/--radius-xl:\s*calc\(var\(--radius, 0\.5rem\) \+ 4px\)/);
    expect(built).toMatch(
      /--space-4:\s*round\(nearest, calc\(var\(--space, 0\.25rem\) \* 4 \* var\(--density, 1\)\), 0\.25rem\);/,
    );
  });

  it("у плотной шкалы в поставке два объявления, и подстраховка стоит первой", () => {
    // Порядок проверяется на СОБРАННОМ файле, а не только на генераторе: между блоками в
    // `base.css` приклеиваются другие куски, и переехавший блок сломал бы решение молча.
    // Браузер без `round()` берёт первое объявление, с поддержкой — второе, потому что
    // `@supports` специфичности не добавляет (`tasker:PROBEWEB-63`).
    const plain = built.indexOf("--space-4: calc(var(--space, 0.25rem) * 4 * var(--density, 1));");
    const guard = built.indexOf("@supports (width: round(nearest, 1rem, 0.25rem)) {");
    const snapped = built.indexOf(
      "--space-4: round(nearest, calc(var(--space, 0.25rem) * 4 * var(--density, 1)), 0.25rem);",
    );

    expect(plain, "первого объявления --space-4 в поставке нет").toBeGreaterThan(-1);
    expect(guard, "блока @supports в поставке нет").toBeGreaterThan(plain);
    expect(snapped, "посадка на сетку стоит раньше подстраховки").toBeGreaterThan(guard);
  });

  it("подстраховка накрывает ровно плотные шкалы, а кегль в неё не попадает", () => {
    // Кегль на сетку не садится вовсе — значит и второго объявления у него быть не может.
    const guard = built.slice(built.indexOf("@supports (width: round("));
    for (const token of ["space-4", "column-40", "control-height-sm"]) {
      expect(guard, `--${token} не подстрахован`).toContain(`--${token}: round(nearest,`);
    }
    expect(guard, "кегль попал под @supports").not.toContain("--font-size-");
    expect(guard, "скругление попало под @supports").not.toContain("--radius-");
  });

  it("в поставке нет ни одного старого имени ступени интервалов", () => {
    // Реестр с двух сторон: всё объявленное шкалой доехало (проба выше) — и в файле нет
    // ничего сверх неё. Без второй стороны переименование прошло бы «зелёным» с обоими
    // наборами имён сразу, а потребитель цепляется как раз за имена.
    const declared = [...strip(built).matchAll(/^\s*--(space-[\w-]+):/gm)].map(
      (match) => match[1],
    );
    const expected = DERIVED_TOKENS.filter((token) => token.startsWith("space-"));

    // Имя интервала объявлено ДВАЖДЫ — подстраховка и посадка на сетку (`PROBEWEB-63`), —
    // поэтому реестр сверяется по именам, а число объявлений проверяется отдельно: иначе
    // третье объявление, взявшееся неизвестно откуда, прошло бы незамеченным.
    expect([...new Set(declared)].sort()).toEqual([...expected].sort());
    expect(declared.length, "у ступени интервалов не ровно два объявления").toBe(
      expected.length * 2,
    );
    // Порядковые имена значили ДРУГИЕ кратности (`--space-5` был множителем 6): останься
    // такое имя в файле — потребитель получил бы прежнее имя с новым значением.
    for (const stale of ["space-5", "space-7", "space-9", "space-10"]) {
      expect(declared, `старое имя --${stale} в поставке`).not.toContain(stale);
    }
  });

  it("ось плотности объявлена и умножает то, что должна, включая кегль", () => {
    expect(built).toContain(`--${DENSITY_TOKEN}: 1;`);
    // Кегль в оси: плотность — равномерное изменение всей вещи (`kb:PROBEWEB-16`, часть А).
    const fontSize = built.match(/--font-size-lg:[^;]+;/)?.[0] ?? "";
    expect(fontSize).toContain(DENSITY_TOKEN);
    // …но на сетку он не садится — шаг сетки разрушил бы отношения ступеней (`GRID_NOTE`).
    expect(fontSize).not.toContain("round(");
    // Геометрия, наоборот, садится: иначе произвольный множитель даёт дробь.
    expect(built).toMatch(/--control-height-sm:\s*round\(nearest,/);
  });

  it("роль ссылается на ступень, а не хранит значение", () => {
    expect(built).toContain("--brand-solid: var(--brand-9);");
    expect(built).toContain("--text-muted: var(--neutral-11);");
  });

  it("устаревшее имя выражено через роль, а не через ступень напрямую", () => {
    // Через ступень оно бы пережило переименование роли и осталось второй правдой.
    expect(built).toContain("--primary: var(--brand-solid);");
    expect(built).toContain("--ring: var(--focus-ring);");
  });
});
