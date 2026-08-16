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
    expect(built).toMatch(/--space-4:\s*calc\(var\(--space, 0\.25rem\) \* 4 \* var\(--density/);
  });

  it("ось плотности объявлена и умножает только то, что должна", () => {
    expect(built).toContain(`--${DENSITY_TOKEN}: 1;`);
    // Кегль плотностью не масштабируется: 1.4.4 Resize Text и читаемость важнее строк на экране.
    const fontSize = built.match(/--font-size-lg:[^;]+;/)?.[0] ?? "";
    expect(fontSize).not.toContain(DENSITY_TOKEN);
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
