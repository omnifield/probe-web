import { describe, expect, it } from "vitest";

import { AA_NON_TEXT, AA_TEXT, contrastRatio } from "../src/color/contrast.js";
import { parseColor } from "../src/color/oklch.js";
import {
  CONTRAST_PROMISES,
  type ScaleMode,
  type ScaleValues,
  buildChartScale,
  buildScale,
} from "../src/scale.js";
import { DEFAULT_SEEDS, SCALE_NAMES } from "../src/tokens.js";

// ГЕЙТ КОНТРАСТА — главный тест зоны. Обещание ступени (`kb:PROBEWEB-12`, пункт 4) не
// «дизайнер посмотрел», а машина посчитала: без него смена бренда молча уводит продукт из
// соответствия, и узнают об этом не мы, а тот, кому это стоит денег.
//
// Считаем на ТОМ ЖЕ ТЕКСТЕ, который уезжает в CSS: `buildScale` отдаёт готовые строки
// `oklch(...)`, и `contrastRatio` разбирает их обратно. Проверять числа до сериализации
// значило бы проверять задумку, а не поставку.
//
// МУТАЦИОННАЯ ПРОВЕРКА (прогонялась руками, воспроизводится за минуту): сдвинь в
// `src/scale.ts` лестницу так, чтобы ступень подошла к фону, — например `BACKDROP_L.light[6]`
// с 0.865 на 0.94 или `TEXT_STRONG_L.light` с 0.24 на 0.75, — и этот файл краснеет,
// называя шкалу, ступень, фон и недостающие доли.

const MODES: ScaleMode[] = ["light", "dark"];

/** Проверка всех объявленных обещаний на одной шкале. */
const checkPromises = (scale: ScaleValues, label: string): void => {
  for (const promise of CONTRAST_PROMISES) {
    for (const background of promise.against) {
      const ratio = contrastRatio(scale[promise.step], scale[background]);
      expect(
        ratio,
        `${label}: ступень ${promise.step} к ступени ${background} — ${ratio.toFixed(2)}:1 при обещанных ${promise.min}:1 (${promise.criterion})`,
      ).toBeGreaterThanOrEqual(promise.min);
    }
  }
};

describe("обещания контраста — дефолтная пара", () => {
  for (const mode of MODES) {
    for (const name of SCALE_NAMES) {
      it(`шкала ${name}, режим ${mode}`, () => {
        checkPromises(buildScale(DEFAULT_SEEDS[name], mode), `${name}/${mode}`);
      });
    }
  }
});

describe("обещания контраста — ЛЮБОЕ семя", () => {
  // Обещание, проверенное на трёх наших цветах, — это не обещание, а совпадение: потребитель
  // придёт со своим брендом. Перебираем сетку по тону, светлоте и цветности: 12 тонов × 5
  // светлот × 3 цветности = 180 шкал на режим.
  const seeds: string[] = [];
  for (let hue = 0; hue < 360; hue += 30) {
    for (const l of [0.25, 0.45, 0.6, 0.75, 0.9]) {
      for (const c of [0, 0.08, 0.25]) seeds.push(`oklch(${l} ${c} ${hue})`);
    }
  }

  for (const mode of MODES) {
    it(`${seeds.length} шкал держат обещание в режиме ${mode}`, () => {
      for (const seed of seeds) checkPromises(buildScale(seed, mode), `${seed}/${mode}`);
    });
  }
});

describe("категориальные цвета данных", () => {
  // На графике цвет — НОСИТЕЛЬ ИНФОРМАЦИИ, а не оформление: 1.4.11 применяется в полную силу.
  for (const mode of MODES) {
    it(`ряды графика дают 3:1 к фону приложения — режим ${mode}`, () => {
      const backdrop = buildScale(DEFAULT_SEEDS.neutral, mode);
      for (const [index, value] of buildChartScale(DEFAULT_SEEDS.brand, mode).entries()) {
        for (const step of ["1", "2"] as const) {
          expect(
            contrastRatio(value, backdrop[step]),
            `ряд ${index + 1} к ступени ${step} (${mode})`,
          ).toBeGreaterThanOrEqual(AA_NON_TEXT);
        }
      }
    });

    it(`ряды графика различимы между собой по тону — режим ${mode}`, () => {
      // Один цвет на два ряда читается как один ряд. Тона разведены на 360/5 градусов;
      // проверяем, что генератор их не схлопнул отображением в охват.
      const hues = buildChartScale(DEFAULT_SEEDS.brand, mode).map(
        (value) => parseColor(value).h,
      );
      expect(new Set(hues.map((hue) => Math.round(hue))).size).toBe(hues.length);
    });
  }
});

describe("формула контраста", () => {
  it("чёрное к белому — 21:1, предел нормы", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("цвет сам с собой — 1:1", () => {
    expect(contrastRatio("oklch(0.5 0.1 200)", "oklch(0.5 0.1 200)")).toBeCloseTo(1, 10);
  });

  it("порядок аргументов не важен — норма определяет отношение, а не разность", () => {
    const a = "#1f6feb";
    const b = "#f0f6fc";
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it("пороги нормы — те, что в WCAG 2.2", () => {
    expect(AA_TEXT).toBe(4.5);
    expect(AA_NON_TEXT).toBe(3);
  });
});
