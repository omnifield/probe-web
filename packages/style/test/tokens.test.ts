import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { DERIVED_TOKENS, FIXED_TOKENS } from "../src/dimension.js";
import { LEGACY_TOKENS, ROLE_TOKENS } from "../src/roles.js";
import {
  CHART_TOKENS,
  DEFAULT_DARK,
  DEFAULT_LIGHT,
  DEFAULT_SEEDS,
  PALETTE_TOKENS,
  SCALE_NAMES,
  SCALE_TOKENS,
  THEME_META_TOKENS,
  type ThemeTokens,
  createTheme,
  themeToCss,
} from "../src/tokens.js";

// Тесты этого файла — гейт КОНТРАКТА: они держат обещание «тема = данные полного набора»
// и «сгенерированный CSS = те же данные». Без них набор токенов расползается молча.

const CONTRACT = new Set<string>([...SCALE_TOKENS, ...THEME_META_TOKENS]);

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
      const missing = SCALE_TOKENS.filter((token) => !(token in theme));
      expect(missing, `тема ${name} не покрывает ядро`).toEqual([]);
    }
  });

  it("в темах нет токенов вне контракта", () => {
    for (const theme of [DEFAULT_LIGHT, DEFAULT_DARK]) {
      const extra = Object.keys(theme).filter((key) => !CONTRACT.has(key));
      expect(extra).toEqual([]);
    }
  });

  it("ядро — это СТУПЕНИ: три шкалы по тринадцать плюс ряд графиков", () => {
    expect(SCALE_TOKENS.length).toBe(SCALE_NAMES.length * 13 + CHART_TOKENS.length);
    expect(PALETTE_TOKENS).toBe(SCALE_TOKENS); // прежнее имя не отвалилось молча
  });

  it("РОЛИ в тему не входят — они одинаковы для всех тем", () => {
    // Роль в теме означала бы, что каждая новая палитра переобъявляет назначения заново, то
    // есть разделение шкалы и роли объявлено, но не сделано.
    for (const role of ROLE_TOKENS) expect(CONTRACT).not.toContain(role);
    for (const legacy of LEGACY_TOKENS) expect(CONTRACT).not.toContain(legacy);
  });

  it("ни одно имя не занято дважды на всех четырёх уровнях", () => {
    // Ступени, роли, устаревшие псевдонимы, производные размеры и мета живут в ОДНОМ
    // пространстве имён CSS: совпадение имён означает, что одно объявление затирает другое —
    // молча и в зависимости от порядка файлов.
    const all = [
      ...SCALE_TOKENS,
      ...THEME_META_TOKENS,
      ...ROLE_TOKENS,
      ...LEGACY_TOKENS,
      ...DERIVED_TOKENS,
      ...FIXED_TOKENS.map((token) => token.name),
    ];
    const seen = new Set<string>();
    const twice = all.filter((name) => (seen.has(name) ? true : (seen.add(name), false)));
    expect(twice).toEqual([]);
  });

  it("пара различима, мета общая, и тёмная — не инверсия светлой", () => {
    expect(DEFAULT_DARK["neutral-1"]).not.toBe(DEFAULT_LIGHT["neutral-1"]);
    expect(DEFAULT_DARK["neutral-12"]).not.toBe(DEFAULT_LIGHT["neutral-12"]);
    expect(DEFAULT_DARK.radius).toBe(DEFAULT_LIGHT.radius);
    expect(DEFAULT_DARK["neutral-3"]).not.toBe(DEFAULT_LIGHT["neutral-10"]);
  });

  it("themeToCss отдаёт блок для селектора, по строке на токен", () => {
    const css = themeToCss(":root", {
      "neutral-1": "red",
      "neutral-12": "blue",
    } as ThemeTokens);
    expect(css).toBe(":root {\n  --neutral-1: red;\n  --neutral-12: blue;\n}");
  });
});

describe("тема из семян", () => {
  it("createTheme строит обе половины из трёх значений", () => {
    const theme = createTheme({ name: "ocean", brand: "#0f6fde" });
    expect(theme.name).toBe("ocean");
    expect(SCALE_TOKENS.every((token) => token in theme.light)).toBe(true);
    expect(SCALE_TOKENS.every((token) => token in theme.dark!)).toBe(true);
  });

  it("незаданная шкала берётся из дефолтной пары", () => {
    // Сменить один только бренд должно стоить одного значения, а не переписывания всех трёх.
    const theme = createTheme({ name: "ocean", brand: "#0f6fde" });
    expect(theme.light["neutral-9"]).toBe(DEFAULT_LIGHT["neutral-9"]);
    expect(theme.light["brand-9"]).not.toBe(DEFAULT_LIGHT["brand-9"]);
  });

  it("дефолтная пара — это createTheme на дефолтных семенах, а не второй набор значений", () => {
    const theme = createTheme({ name: "default", ...DEFAULT_SEEDS });
    expect(theme.light).toEqual(DEFAULT_LIGHT);
    expect(theme.dark).toEqual(DEFAULT_DARK);
  });

  it("мета-токены переопределяются, не ломая ядро", () => {
    const theme = createTheme({ name: "dense", meta: { space: "0.2rem" } });
    expect(theme.light.space).toBe("0.2rem");
    expect(theme.light.radius).toBe(DEFAULT_LIGHT.radius);
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

  it("ролей и устаревших псевдонимов в теме нет — они живут в base.css", () => {
    const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const role of ROLE_TOKENS) expect(body).not.toContain(`--${role}:`);
    for (const legacy of LEGACY_TOKENS) expect(body).not.toContain(`--${legacy}:`);
  });

  it("кастомные палитры в дефолтный файл не попадают", () => {
    // Сравниваем тело без комментариев: шапка про `data-theme` рассказывает, и гейт по
    // всему файлу спотыкался бы о собственную документацию.
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toContain("data-theme");
  });
});
