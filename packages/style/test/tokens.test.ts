import { describe, expect, it } from "vitest";

import { DERIVED_TOKENS, FIXED_TOKENS } from "../src/dimension.js";
import { LEGACY_TOKENS, ROLE_TOKENS } from "../src/roles.js";
import {
  CHART_TOKENS,
  PALETTE_TOKENS,
  SCALE_NAMES,
  SCALE_TOKENS,
  THEME_META_TOKENS,
  type ThemeTokens,
  createTheme,
  themeToCss,
} from "../src/tokens.js";
import { DARK, LIGHT, SEEDS } from "./helpers/seeds.js";

// Тесты этого файла — гейт КОНТРАКТА: они держат обещание «тема = данные полного набора».
// Собранный CSS проверяется отдельно (`test/themes-css.test.ts`): там же живёт правило,
// ради которого палитра принимает имя, а не селектор (`kb:PROBEWEB-18`), и держать его
// рядом с контрактом токенов значило бы смешать два разных вопроса в одном файле.

const CONTRACT = new Set<string>([...SCALE_TOKENS, ...THEME_META_TOKENS]);

describe("токен-контракт", () => {
  it("обе дефолтные темы покрывают ПОЛНОЕ цветовое ядро", () => {
    for (const [name, theme] of [
      ["light", LIGHT],
      ["dark", DARK],
    ] as const) {
      const missing = SCALE_TOKENS.filter((token) => !(token in theme));
      expect(missing, `тема ${name} не покрывает ядро`).toEqual([]);
    }
  });

  it("в темах нет токенов вне контракта", () => {
    for (const theme of [LIGHT, DARK]) {
      const extra = Object.keys(theme).filter((key) => !CONTRACT.has(key));
      expect(extra).toEqual([]);
    }
  });

  it("ядро — это СТУПЕНИ: три шкалы по 25, ряд графиков и затемнение", () => {
    // 25 на шкалу = 12 сплошных + 12 альфа + подпись на сплошном.
    expect(SCALE_TOKENS.length).toBe(SCALE_NAMES.length * 25 + CHART_TOKENS.length + 1);
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
    expect(DARK["neutral-1"]).not.toBe(LIGHT["neutral-1"]);
    expect(DARK["neutral-12"]).not.toBe(LIGHT["neutral-12"]);
    expect(DARK.radius).toBe(LIGHT.radius);
    expect(DARK["neutral-3"]).not.toBe(LIGHT["neutral-10"]);
  });

  it("themeToCss отдаёт блок для селектора, по строке на токен", () => {
    // Форматирование блока и только оно. КАКОЙ селектор получает палитра, решает
    // `paletteSelector()` (`src/palette.ts`), и на поверхность эта функция не выходит:
    // свободный селектор снаружи — второй способ объявить палитру (`kb:PROBEWEB-18`).
    const css = themeToCss('[data-theme="ocean"]', {
      "neutral-1": "red",
      "neutral-12": "blue",
    } as ThemeTokens);
    expect(css).toBe('[data-theme="ocean"] {\n  --neutral-1: red;\n  --neutral-12: blue;\n}');
  });
});

describe("тема из семян", () => {
  it("createTheme строит обе половины из трёх значений", () => {
    const theme = createTheme({ name: "ocean", ...SEEDS, brand: "#0f6fde" });
    expect(theme.name).toBe("ocean");
    expect(SCALE_TOKENS.every((token) => token in theme.light)).toBe(true);
    expect(SCALE_TOKENS.every((token) => token in theme.dark!)).toBe(true);
  });

  it("семена обязательны все три — незаданное больше НЕ берётся из нашей пары", () => {
    // Прежде незаданная шкала подставлялась из дефолтных семян, и это было удобно ровно до
    // того, как выяснилось, чем оно является: незаданный бренд молча приносил НАШ бренд, то
    // есть палитру фреймворка (`PWEB-50`). Дефолтной пары нет, подставлять нечего.
    //
    // Держится ТИПОМ, а не прогоном: пропущенное семя не компилируется у потребителя, и
    // ловится это в `types.test.ts` на чистой установке. Здесь — поведение: своё семя едет
    // в свою шкалу и не задевает соседние.
    const theme = createTheme({ name: "ocean", ...SEEDS, brand: "#0f6fde" });
    expect(theme.light["neutral-9"]).toBe(LIGHT["neutral-9"]);
    expect(theme.light["brand-9"]).not.toBe(LIGHT["brand-9"]);
  });

  it("пара из семян считается тем же построением, а не вторым набором значений", () => {
    const theme = createTheme({ name: "probe", ...SEEDS });
    expect(theme.light).toEqual(LIGHT);
    expect(theme.dark).toEqual(DARK);
  });

  it("мета-токены переопределяются, не ломая ядро", () => {
    const theme = createTheme({ name: "dense", ...SEEDS, meta: { space: "0.2rem" } });
    expect(theme.light.space).toBe("0.2rem");
    expect(theme.light.radius).toBe(LIGHT.radius);
  });
});
