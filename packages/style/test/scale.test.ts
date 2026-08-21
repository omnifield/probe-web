import { describe, expect, it } from "vitest";

import { contrastRatio } from "../src/color/contrast.js";
import { parseColor } from "../src/color/parse.js";
import {
  CONTRAST_PROMISES,
  NO_PROMISE,
  SCALE_STEPS,
  STEP_PURPOSE,
  type ScaleKey,
  buildScale,
} from "../src/scale.js";
import { LEGACY_ALIASES, ROLES, ROLE_TOKENS, legacyCss, rolesCss } from "../src/roles.js";
import {
  DEFAULT_SEEDS,
  SCALE_TOKENS,
  createTheme,
  type ThemeTokens,
} from "../src/tokens.js";

// Тесты МОДЕЛИ: что ступень значит и что от неё нельзя отнять. Контраст проверяется отдельно
// (`contrast.test.ts`) — здесь всё остальное, ради чего модель и брали.

const ALL_KEYS: ScaleKey[] = [...SCALE_STEPS.map((step) => `${step}` as ScaleKey), "contrast"];

/** Все имена ступеней, включая альфа-ряд: про каждую обязано быть сказано. */
const EVERY_STEP: string[] = [...ALL_KEYS, ...SCALE_STEPS.map((step) => `a${step}`)];

describe("модель ступеней", () => {
  const scale = buildScale(DEFAULT_SEEDS.brand, "light");

  it("двенадцать ступеней и подпись на сплошной — ни одной пропущенной", () => {
    expect(Object.keys(scale).sort()).toEqual([...ALL_KEYS].sort());
    for (const key of ALL_KEYS) expect(scale[key], `ступень ${key}`).toMatch(/^oklch\(/);
  });

  it("у каждой ступени объявлено НАЗНАЧЕНИЕ — номер сам по себе ничего не значит", () => {
    for (const step of SCALE_STEPS) expect(STEP_PURPOSE[step]).toBeTruthy();
  });

  it("про каждую ступень сказано, есть на ней гарантия контраста или нет", () => {
    // Молчание читается как «гарантия есть», и потребитель узнаёт правду от аудитора.
    const promised = new Set<string>(CONTRAST_PROMISES.map((promise) => promise.step));
    const disclaimed = new Set(
      Object.keys(NO_PROMISE).flatMap((range) => {
        // Диапазон вида `1-5` или `a1-a12`: префикс `a` — альфа-ряд.
        const [from, to] = range.split("-");
        const prefix = from.startsWith("a") ? "a" : "";
        const start = Number(from.replace("a", ""));
        const end = Number(to.replace("a", ""));
        return Array.from({ length: end - start + 1 }, (_, i) => `${prefix}${start + i}`);
      }),
    );
    const silent = EVERY_STEP.filter((key) => !promised.has(key) && !disclaimed.has(key));
    expect(silent, "ступень, про которую не сказано ничего").toEqual([]);
  });

  it("ступени 1–5 — ФОНЫ: они держатся друг друга, а не контрастируют", () => {
    // Если фон элемента отъедет от фона приложения, «фоном элемента» он быть перестанет —
    // это уже поверхность другого уровня, и назначение ступени сломано.
    for (const step of ["2", "3", "4", "5"] as const) {
      expect(contrastRatio(scale[step], scale["1"]), `ступень ${step}`).toBeLessThan(1.5);
    }
  });

  it("состояния элемента различимы — иначе наведение нечем показать", () => {
    expect(scale["3"]).not.toBe(scale["4"]);
    expect(scale["4"]).not.toBe(scale["5"]);
    expect(scale["9"]).not.toBe(scale["10"]);
  });

  it("наведение уводит сплошную ступень ОТ её подписи, а не к ней", () => {
    // Иначе состояние наведения роняет контраст подписи ниже нормы — кнопка соответствует
    // норме, пока на неё не навели.
    for (const seed of ["#0f6fde", "#ffd400", "#111111", "#f5f5f5"]) {
      for (const mode of ["light", "dark"] as const) {
        const built = buildScale(seed, mode);
        expect(
          contrastRatio(built.contrast, built["10"]),
          `${seed}/${mode}: наведение не должно ухудшать подпись`,
        ).toBeGreaterThanOrEqual(contrastRatio(built.contrast, built["9"]));
      }
    }
  });
});

describe("тёмная шкала — СВОЯ, а не перевёрнутая светлая", () => {
  const light = buildScale(DEFAULT_SEEDS.neutral, "light");
  const dark = buildScale(DEFAULT_SEEDS.neutral, "dark");

  it("ступень тёмной шкалы не равна зеркальной ступени светлой", () => {
    // Инверсия ломает назначение: фон элемента становится текстом (`kb:PROBEWEB-12`, п.1).
    for (const step of SCALE_STEPS) {
      const mirrored = light[`${13 - step}` as ScaleKey];
      expect(dark[`${step}` as ScaleKey], `ступень ${step}`).not.toBe(mirrored);
    }
  });

  it("назначение сохраняется в обоих режимах: 1–5 остаются фонами, 12 — текстом", () => {
    for (const scale of [light, dark]) {
      for (const step of ["2", "3", "4", "5"] as const) {
        expect(contrastRatio(scale[step], scale["1"])).toBeLessThan(1.5);
      }
      expect(contrastRatio(scale["12"], scale["1"])).toBeGreaterThan(10);
    }
  });

  it("фон приложения в тёмном режиме тёмный, в светлом — светлый", () => {
    expect(parseColor(light["1"]).l).toBeGreaterThan(0.9);
    expect(parseColor(dark["1"]).l).toBeLessThan(0.3);
  });

  it("сплошная ступень не тонет в фоне тёмного режима", () => {
    // Чёрная кнопка на белом и чёрная кнопка на чёрном — это не «одна тема в двух режимах»,
    // это исчезнувшая кнопка.
    expect(contrastRatio(dark["9"], dark["1"])).toBeGreaterThan(3);
  });
});

describe("смена бренда — ОДНО значение", () => {
  const before = createTheme({ name: "before" });
  const after = createTheme({ name: "after", brand: "#0f6fde" });

  const changed = (a: ThemeTokens, b: ThemeTokens, prefix: string): string[] =>
    SCALE_TOKENS.filter((token) => token.startsWith(prefix) && a[token] !== b[token]);

  it("перекрашивает шкалу бренда целиком — и сплошной ряд, и альфа-ряд", () => {
    // 12 сплошных + 12 альфа + подпись на сплошном.
    expect(changed(before.light, after.light, "brand-").length).toBe(25);
    expect(changed(before.dark!, after.dark!, "brand-").length).toBe(25);
  });

  it("не трогает шкалы, которых не касались", () => {
    expect(changed(before.light, after.light, "neutral-")).toEqual([]);
    expect(changed(before.light, after.light, "danger-")).toEqual([]);
  });

  it("не трогает РОЛИ — они ссылаются на ступень, а не хранят цвет", () => {
    // Ради этого разделение и вводилось: имена, за которые цепляется потребитель, переживают
    // смену бренда.
    expect(rolesCss()).toBe(rolesCss());
    for (const token of ROLE_TOKENS) {
      expect(Object.keys(after.light)).not.toContain(token);
    }
  });
});

describe("семантический слой", () => {
  it("каждая роль ссылается на СУЩЕСТВУЮЩИЙ токен шкалы", () => {
    for (const role of ROLES) {
      expect(SCALE_TOKENS, `роль --${role.name}`).toContain(role.token);
    }
  });

  it("у каждой роли объявлено назначение, и имя не начинается с номера ступени", () => {
    for (const role of ROLES) {
      expect(role.purpose, `роль --${role.name}`).toBeTruthy();
      expect(role.name).not.toMatch(/-\d+$/);
    }
  });

  it("роли не хранят цвет — только ссылку на ступень", () => {
    const css = rolesCss();
    expect(css.replace(/\/\*[\s\S]*?\*\//g, "")).not.toMatch(/oklch\(|#[0-9a-f]{3,8}\b/i);
    for (const role of ROLES) {
      expect(css).toContain(`--${role.name}: var(--${role.token});`);
    }
  });

  it("прежний плоский набор выражен через роли, а не оставлен значениями", () => {
    const css = legacyCss();
    for (const alias of LEGACY_ALIASES) {
      expect(ROLE_TOKENS, `псевдоним --${alias.name}`).toContain(alias.role);
      expect(css).toContain(`--${alias.name}: var(--${alias.role});`);
    }
  });

  it("устаревшее имя не занимает имя роли — иначе одно объявление затирало бы другое", () => {
    for (const alias of LEGACY_ALIASES) {
      expect(ROLE_TOKENS).not.toContain(alias.name);
    }
  });
});
