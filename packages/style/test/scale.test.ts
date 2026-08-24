import { describe, expect, it } from "vitest";

import { contrastRatio } from "../src/color/contrast.js";
import { parseColor } from "../src/color/parse.js";
import { SEEDS } from "./helpers/seeds.js";
import {
  CONTRAST_PROMISES,
  NO_PROMISE,
  SCALE_STEPS,
  STEP_PURPOSE,
  type ScaleKey,
  buildScale,
} from "../src/scale.js";

// Тесты МОДЕЛИ: что ступень значит и что от неё нельзя отнять. Контраст проверяется отдельно
// (`contrast.test.ts`) — здесь всё остальное, ради чего модель и брали.

const ALL_KEYS: ScaleKey[] = [...SCALE_STEPS.map((step) => `${step}` as ScaleKey), "contrast"];

/** Все имена ступеней, включая альфа-ряд: про каждую обязано быть сказано. */
const EVERY_STEP: string[] = [...ALL_KEYS, ...SCALE_STEPS.map((step) => `a${step}`)];

describe("модель ступеней", () => {
  const scale = buildScale(SEEDS.brand, "light");

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
  const light = buildScale(SEEDS.neutral, "light");
  const dark = buildScale(SEEDS.neutral, "dark");

  it("ступень тёмной шкалы не равна зеркальной ступени светлой", () => {
    // Инверсия ломает назначение: фон элемента становится текстом (`PROBEWEB-12`, п.1).
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

// РАЗДЕЛ «СМЕНА БРЕНДА — ОДНО ЗНАЧЕНИЕ» СНЯТ (`PWEB-66`, вторым заходом). Он стоял на
// `createTheme` — сборщике ТЕМЫ, а темы как единицы больше нет: единицей стал скин, и
// пересевает он себя сам, вызывая `buildScale` напрямую.
//
// Обязательство при этом не потерялось и не ослабло: «поменял семя — поменялась вся половина»
// проверяется там, где это теперь и происходит, — в `packages/skin` на его собственных семенах.
// Здесь остаётся то, что он зовёт: построение половины из одного значения, и оно проверено выше.
