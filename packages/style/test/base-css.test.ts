import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { PALETTE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// Инвариант base.css машиной, а не обещанием в шапке файла: базовый слой обязан
// РЕФЕРЕНСИТЬ тему, а не подменять её. Литеральный цвет здесь не переключается вместе с
// режимом и всплывает светлым пятном в тёмной странице.

const css = readFileSync(resolve(import.meta.dirname, "../src/css/base.css"), "utf8");

/** Тело файла без комментариев — иначе гейт спотыкается о примеры в тексте. */
const code = css.replace(/\/\*[\s\S]*?\*\//g, "");

describe("base.css", () => {
  it("не содержит литеральных цветов", () => {
    const literals = code.match(/(oklch|rgba?|hsla?)\(|#[0-9a-fA-F]{3,8}\b/g);
    expect(literals, "цвет в базовом слое не переключается темой").toBeNull();
  });

  it("каждый читаемый токен объявлен либо контрактом темы, либо этим же файлом", () => {
    const declared = new Set(
      [...code.matchAll(/^\s*(--[\w-]+):/gm)].map((match) => match[1].slice(2)),
    );
    const contract = new Set<string>([...PALETTE_TOKENS, ...THEME_META_TOKENS]);

    const unknown = [...code.matchAll(/var\((--[\w-]+)/g)]
      .map((match) => match[1].slice(2))
      .filter((token) => !declared.has(token) && !contract.has(token));

    expect([...new Set(unknown)], "ссылка на токен вне контракта").toEqual([]);
  });

  it("объявляет `color-scheme` для обоих режимов — от него зависят системные элементы", () => {
    expect(code).toContain("color-scheme: light");
    expect(code).toContain("color-scheme: dark");
  });

  it("шкала радиусов производна от токена `--radius`", () => {
    expect(code).toContain("--radius-lg: var(--radius);");
    expect(code).toMatch(/--radius-xl:\s*calc\(var\(--radius\)/);
  });
});
