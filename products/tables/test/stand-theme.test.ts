// Тёмная тема стенда — проверяется не «красиво ли», а тем, из-за чего она ломается.
//
// Тема у нас это ДАННЫЕ: стилевой слой красит `:root` светлой парой токенов, `.dark` — тёмной.
// Значит достаточно двух вещей, и обе машинно проверяемы: носитель класса стоит в разметке, а
// оформление стенда не везёт ни одного цвета литералом. Зашитый `#fff` темы не знает и в
// тёмной паре останется белым — молча и только на экране, куда сейчас никто не смотрит.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const read = (relative: string): string =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), "utf8");

describe("тёмная тема", () => {
  it("класс `dark` стоит на корне разметки — тема встаёт до первого кадра, без JS", () => {
    const html = read("../index.html");
    const root = /<html[^>]*>/.exec(html)?.[0] ?? "";

    expect(root).toMatch(/\bclass="[^"]*\bdark\b[^"]*"/);
  });

  it("тема подключена целиком: базовый CSS и пара тем", () => {
    const main = read("../src/playground/main.tsx");

    expect(main).toContain("@omnifield/probe-web-style/base.css");
    expect(main).toContain("@omnifield/probe-web-style/themes.css");
  });

  it("в оформлении стенда НЕТ ни одного цвета литералом — только токены", () => {
    const css = read("../src/playground/playground.css");

    // Комментарии выкидываем: в них цвета упоминаются текстом, и это не оформление.
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const literals = [
      ...code.matchAll(/#[0-9a-fA-F]{3,8}\b/g),
      ...code.matchAll(/\b(?:rgba?|hsla?|oklch|lab|lch)\s*\(/g),
      ...code.matchAll(/(?<![\w-])(?:white|black|red|green|blue|gray|grey)(?![\w-])/g),
    ].map((found) => found[0]);

    expect(literals).toEqual([]);
  });

  it("замес цвета — тоже по токенам: `color-mix` без токена внутри был бы тем же литералом", () => {
    const code = read("../src/playground/playground.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const mixes = [...code.matchAll(/color-mix\(([^;]*?)\)\s*[;,]/g)].map((found) => found[1]!);

    expect(mixes.length).toBeGreaterThan(0);
    for (const mix of mixes) expect(mix).toMatch(/var\(--/);
  });

  it("цвет берётся токенами стилевого слоя, а не выдуман на месте", () => {
    const css = read("../src/playground/playground.css");

    expect(css).toMatch(/var\(--foreground\)/);
    expect(css).toMatch(/var\(--background\)|var\(--card\)/);
  });
});
