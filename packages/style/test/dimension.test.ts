import { describe, expect, it } from "vitest";

import {
  DENSITY_DEFAULT,
  DENSITY_FLOOR,
  DENSITY_TOKEN,
  DERIVED_SCALES,
  DERIVED_TOKENS,
  FIXED_TOKENS,
  derivedCss,
  stepValue,
} from "../src/dimension.js";
import { THEME_META_TOKENS } from "../src/tokens.js";

// Размерные шкалы — гейт того же обещания, что и у цвета: значение выводится из ОДНОГО семени,
// а не набирается россыпью. Россыпь проверить нечем — она просто есть; шкалу проверить можно.

/** Числовое значение ступени в rem при заданной плотности — считаем ровно то, что в CSS. */
const rem = (seedRem: number, factor: number, density: number): number =>
  seedRem * factor * density;

describe("производные шкалы", () => {
  it("каждая ступень выведена из семени и несёт его значение по умолчанию", () => {
    for (const scale of DERIVED_SCALES) {
      for (const step of scale.steps) {
        const value = stepValue(scale, step);
        if ("value" in step) continue; // литерал вроде `9999px` — не производная
        expect(value, `--${step.name}`).toContain(`var(--${scale.seed}, ${scale.fallback})`);
      }
    }
  });

  it("семя каждой шкалы объявлено контрактом темы", () => {
    // Иначе шкала считается от токена, которого в контракте нет: тема его не задаст, и
    // работать всё будет только на подставленном по умолчанию значении.
    for (const scale of DERIVED_SCALES) {
      expect(THEME_META_TOKENS, `семя --${scale.seed}`).toContain(scale.seed);
    }
  });

  it("ни один токен не объявлен дважды", () => {
    const names = [...DERIVED_TOKENS, ...FIXED_TOKENS.map((token) => token.name)];
    expect(names.length).toBe(new Set(names).size);
  });

  it("семя не объявлено ступенью самого себя — это цикл, и браузер такое свойство отменяет", () => {
    for (const scale of DERIVED_SCALES) {
      expect(DERIVED_TOKENS, `семя --${scale.seed}`).not.toContain(scale.seed);
    }
  });

  it("шкалы растут по ступеням, а не как придётся", () => {
    for (const scale of DERIVED_SCALES) {
      const factors = scale.steps.flatMap((step) => ("factor" in step ? [step.factor] : []));
      expect([...factors].sort((a, b) => a - b), `шкала ${scale.seed}`).toEqual(factors);
    }
  });

  it("у каждой шкалы объявлено основание шага", () => {
    // Рынок публикует значения и почти нигде не говорит, ПОЧЕМУ шаг такой
    // (`canons/ui-skin/gaps/scale-step-basis-and-rhythm.md`). Здесь основание — поле, а не
    // фраза в чьей-то голове.
    for (const scale of DERIVED_SCALES) expect(scale.basis.length).toBeGreaterThan(20);
  });
});

describe("ось плотности", () => {
  const byDensity = (want: boolean): string[] =>
    DERIVED_SCALES.filter((scale) => scale.density === want).map((scale) => scale.seed);

  it("умножает интервалы и высоты контролов", () => {
    expect(byDensity(true).sort()).toEqual(["control-height", "space"]);
  });

  it("НЕ трогает кегль, скругления и толщины границ", () => {
    // Уменьшенный плотным режимом текст ломает 1.4.4 Resize Text, а плотность нужна ради
    // количества строк на экране, а не ради мелкого шрифта.
    expect(byDensity(false).sort()).toEqual(["border-width", "font-size", "radius", "tracking"]);
  });

  it("ось объявлена в CSS со значением по умолчанию", () => {
    expect(derivedCss()).toContain(`--${DENSITY_TOKEN}: ${DENSITY_DEFAULT};`);
  });

  it("ступени плотных шкал ссылаются на ось, остальные — нет", () => {
    for (const scale of DERIVED_SCALES) {
      for (const step of scale.steps) {
        if ("value" in step) continue;
        const uses = stepValue(scale, step).includes(`var(--${DENSITY_TOKEN}`);
        expect(uses, `--${step.name}`).toBe(scale.density);
      }
    }
  });

  it("нижняя граница оси взята из нормы, а не назначена", () => {
    // При плотности `d` нижняя ступень контрола обязана остаться не ниже минимального
    // размера цели 24×24 CSS-пикселя (WCAG 2.2, 2.5.8 Target Size (Minimum), AA).
    const control = DERIVED_SCALES.find((scale) => scale.seed === "control-height")!;
    const smallest = control.steps.find((step) => step.name === "control-height-sm")!;
    const targetMin = FIXED_TOKENS.find((token) => token.name === "control-target-min")!;

    const seedRem = Number.parseFloat(control.fallback);
    const minRem = Number.parseFloat(targetMin.value);
    const factor = "factor" in smallest ? smallest.factor : Number.NaN;

    expect(rem(seedRem, factor, DENSITY_FLOOR)).toBeCloseTo(minRem, 10);
    // Шаг ниже границы — и норма нарушена: граница именно там, где объявлена.
    expect(rem(seedRem, factor, DENSITY_FLOOR - 0.01)).toBeLessThan(minRem);
  });

  it("при плотности 1 нижняя ступень контрола выше минимума цели", () => {
    expect(rem(2.5, 0.8, 1)).toBeGreaterThan(1.5);
  });
});

describe("токены без шкалы", () => {
  it("высота строки безразмерна — она множитель кегля, а не длина", () => {
    for (const token of FIXED_TOKENS.filter((item) => item.name.startsWith("leading-"))) {
      expect(token.value, token.name).toMatch(/^\d+(\.\d+)?$/);
    }
  });

  it("начертания — числовой ряд нормы (CSS Fonts 4, §2.3)", () => {
    const weights = FIXED_TOKENS.filter((token) => token.name.startsWith("weight-")).map(
      (token) => Number(token.value),
    );
    expect(weights).toEqual([400, 500, 600, 700]);
  });

  it("минимальный размер цели назван нормой и ничем не масштабируется", () => {
    const target = FIXED_TOKENS.find((token) => token.name === "control-target-min")!;
    expect(target.note).toMatch(/2\.5\.8/);
    expect(DERIVED_TOKENS).not.toContain("control-target-min");
  });
});
