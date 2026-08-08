import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  PALETTE_TOKENS,
  THEME_META_TOKENS,
  type ThemeTokens,
  themeToCss,
} from "../src/tokens.js";

// Тесты этого файла — гейт КОНТРАКТА: они держат обещание «тема = данные полного набора»
// и «сгенерированный CSS = те же данные». Без них набор токенов расползается молча.

const CONTRACT = new Set<string>([...PALETTE_TOKENS, ...THEME_META_TOKENS]);

/** Парс CSS-блока в карту токенов: `selector { --k: v; }` → `{ k: v }`. */
const parseBlock = (css: string, selector: string): Record<string, string> => {
  const start = css.indexOf(`${selector} {`);
  expect(start, `селектор «${selector}» найден в themes.css`).toBeGreaterThanOrEqual(0);

  const body = css.slice(start + selector.length + 2, css.indexOf("}", start));
  const out: Record<string, string> = {};
  for (const line of body.split(";")) {
    const match = line.match(/--([\w-]+):\s*([\s\S]+)/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
};

describe("токен-контракт", () => {
  it("обе дефолтные темы покрывают ПОЛНОЕ цветовое ядро", () => {
    for (const [name, theme] of [
      ["light", DEFAULT_LIGHT],
      ["dark", DEFAULT_DARK],
    ] as const) {
      const missing = PALETTE_TOKENS.filter((token) => !(token in theme));
      expect(missing, `тема ${name} не покрывает ядро`).toEqual([]);
    }
  });

  it("в темах нет токенов вне контракта", () => {
    for (const theme of [DEFAULT_LIGHT, DEFAULT_DARK]) {
      const extra = Object.keys(theme).filter((key) => !CONTRACT.has(key));
      expect(extra).toEqual([]);
    }
  });

  it("пара различима: цвета инвертированы, мета общая", () => {
    expect(DEFAULT_DARK.background).not.toBe(DEFAULT_LIGHT.background);
    expect(DEFAULT_DARK.foreground).not.toBe(DEFAULT_LIGHT.foreground);
    expect(DEFAULT_DARK.radius).toBe(DEFAULT_LIGHT.radius);
  });

  it("themeToCss отдаёт блок для селектора, по строке на токен", () => {
    const css = themeToCss(":root", { background: "red", foreground: "blue" } as ThemeTokens);
    expect(css).toBe(":root {\n  --background: red;\n  --foreground: blue;\n}");
  });
});

describe("сгенерированный themes.css", () => {
  // Файл собирается из tokens.ts (`scripts/build-css.mjs`), поэтому расходиться с TS ему
  // не с чем — тест проверяет, что генератор ДОЕХАЛ и обе половины пары на месте.
  const css = readFileSync(resolve(import.meta.dirname, "../dist/css/themes.css"), "utf8");

  it("светлый режим на `:root` — токен-в-токен с DEFAULT_LIGHT", () => {
    expect(parseBlock(css, ":root")).toEqual(DEFAULT_LIGHT);
  });

  it("тёмный режим на `.dark` — токен-в-токен с DEFAULT_DARK", () => {
    expect(parseBlock(css, ":root.dark, .dark")).toEqual(DEFAULT_DARK);
  });

  it("кастомные палитры в дефолтный файл не попадают", () => {
    // Сравниваем тело без комментариев: шапка про `data-theme` рассказывает, и гейт по
    // всему файлу спотыкался бы о собственную документацию.
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain("data-theme");
  });
});
