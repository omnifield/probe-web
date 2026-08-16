import { describe, expect, it } from "vitest";

import { composite, veilOver } from "../src/color/alpha.js";
import { oklchToSrgb, parseColor, type Srgb } from "../src/color/oklch.js";
import { SCALE_STEPS, buildAlphaScale, buildScale, buildScrim } from "../src/scale.js";
import { DEFAULT_SEEDS, SCALE_NAMES } from "../src/tokens.js";

// Альфа-ступени существуют ради одного обещания: ступень `aN` поверх ступени 1 даёт ступень
// `N`. Обещание проверяемое — значит, проверяется машиной, а не глазами на стенде.
//
// Считаем на ГОТОВОЙ строке из шкалы (`oklch(... / α)`), а не на числах до сериализации:
// округление прозрачности и цвета — часть поставки, и «сходилось до округления» ничего не значит.

/**
 * Разбор поставляемого значения альфа-ступени. `parseColor` прозрачность не берёт намеренно,
 * поэтому режем строку сами. Отсутствие `/ α` означает вырожденную (непрозрачную) ступень —
 * см. проверку вырождения ниже.
 */
const readVeil = (value: string): { color: Srgb; alpha: number } => {
  const [color, alpha] = value.replace(/^oklch\(|\)$/g, "").split("/");
  return {
    color: oklchToSrgb(parseColor(`oklch(${color.trim()})`)),
    alpha: alpha === undefined ? 1 : Number.parseFloat(alpha),
  };
};

const MODES = ["light", "dark"] as const;

describe("разложение цвета на вуаль", () => {
  it("композиция возвращает цель — на белом, на чёрном и на середине", () => {
    const target: Srgb = { r: 0.2, g: 0.45, b: 0.8 };
    for (const background of [
      { r: 1, g: 1, b: 1 },
      { r: 0, g: 0, b: 0 },
      { r: 0.5, g: 0.5, b: 0.5 },
    ]) {
      const back = composite(veilOver(target, background), background);
      expect(back.r).toBeCloseTo(target.r, 6);
      expect(back.g).toBeCloseTo(target.g, 6);
      expect(back.b).toBeCloseTo(target.b, 6);
    }
  });

  it("прозрачность минимальна — вуаль перекрывает ровно столько, сколько нужно", () => {
    // Чем меньше перекрытие, тем честнее вуаль на произвольном фоне: она обязана
    // подкрашивать, а не подменять.
    const white: Srgb = { r: 1, g: 1, b: 1 };
    const almostWhite = veilOver({ r: 0.98, g: 0.98, b: 0.98 }, white);
    const halfGrey = veilOver({ r: 0.5, g: 0.5, b: 0.5 }, white);
    expect(almostWhite.alpha).toBeLessThan(halfGrey.alpha);
    expect(almostWhite.alpha).toBeLessThan(0.05);
  });

  it("цвет вуали остаётся в 0…1 по всем каналам", () => {
    // Прозрачность округляется ВВЕРХ именно поэтому: округли вниз — канал вылезает, его
    // обрезают, и цель перестаёт получаться.
    for (let i = 0; i <= 20; i += 1) {
      const level = i / 20;
      const veil = veilOver({ r: level, g: 1 - level, b: 0.5 }, { r: 1, g: 1, b: 1 });
      for (const channel of ["r", "g", "b"] as const) {
        expect(veil.color[channel]).toBeGreaterThanOrEqual(0);
        expect(veil.color[channel]).toBeLessThanOrEqual(1);
      }
    }
  });

  it("совпавший с фоном цвет не улетает в бесконечность", () => {
    const veil = veilOver({ r: 1, g: 1, b: 1 }, { r: 1, g: 1, b: 1 });
    expect(Number.isFinite(veil.alpha)).toBe(true);
    expect(veil.alpha).toBeGreaterThan(0);
  });
});

describe("альфа-шкала — параллельная сплошной", () => {
  for (const mode of MODES) {
    for (const name of SCALE_NAMES) {
      it(`${name}/${mode}: ступень aN поверх ступени 1 даёт ступень N`, () => {
        const solid = buildScale(DEFAULT_SEEDS[name], mode);
        const alpha = buildAlphaScale(DEFAULT_SEEDS[name], mode);
        const background = oklchToSrgb(parseColor(solid["1"]));

        for (const step of SCALE_STEPS) {
          const target = oklchToSrgb(parseColor(solid[`${step}`]));
          const got = composite(readVeil(alpha[`a${step}`]), background);
          for (const channel of ["r", "g", "b"] as const) {
            expect(
              got[channel],
              `${name}/${mode}: ступень a${step}, канал ${channel}`,
            ).toBeCloseTo(target[channel], 2);
          }
        }
      });
    }
  }

  it("альфа-ступень следует за режимом: в светлом затемняет, в тёмном осветляет", () => {
    // Для подсветки при наведении это и нужно: на светлой странице она темнее фона, на
    // тёмной — светлее. Инверсной вуали не существует, есть вуаль своего режима.
    const light = readVeil(buildAlphaScale(DEFAULT_SEEDS.neutral, "light").a4);
    const dark = readVeil(buildAlphaScale(DEFAULT_SEEDS.neutral, "dark").a4);
    expect(light.color.r).toBeLessThan(0.5);
    expect(dark.color.r).toBeGreaterThan(0.5);
  });

  it("на фоновой половине шкалы прозрачность растёт вместе с номером ступени", () => {
    // Только 1–8: ступени 9–10 идут от бренда, и порядок там задаёт он, а не лестница —
    // ровно как у сплошной шкалы, которую альфа-ряд повторяет.
    const alpha = buildAlphaScale(DEFAULT_SEEDS.neutral, "light");
    const ladder = SCALE_STEPS.slice(0, 8).map((step) => readVeil(alpha[`a${step}`]).alpha);
    expect([...ladder].sort((a, b) => a - b)).toEqual(ladder);
  });

  it("фоновые ступени всегда просвечивают — иначе вуали нет вовсе", () => {
    for (const mode of MODES) {
      for (const name of SCALE_NAMES) {
        const alpha = buildAlphaScale(DEFAULT_SEEDS[name], mode);
        for (const step of SCALE_STEPS.slice(0, 8)) {
          expect(alpha[`a${step}`], `${name}/${mode}: a${step}`).toMatch(
            /^oklch\([^)]+ \/ [\d.]+\)$/,
          );
        }
      }
    }
  });

  it("вырожденная ступень равна сплошной, а не приближает её", () => {
    // Насыщенный цвет с почти нулевым каналом поверх почти белого фона недостижим НИ ПРИ
    // КАКОЙ прозрачности — это свойство композиции, а не дефект. В такой точке вуаль честно
    // становится непрозрачной и совпадает со сплошной ступенью: приближение здесь означало бы
    // другой цвет под тем же именем.
    for (const mode of MODES) {
      for (const name of SCALE_NAMES) {
        const solid = buildScale(DEFAULT_SEEDS[name], mode);
        const alpha = buildAlphaScale(DEFAULT_SEEDS[name], mode);
        for (const step of SCALE_STEPS) {
          const value = alpha[`a${step}`];
          if (value.includes("/")) continue;
          expect(value, `${name}/${mode}: a${step}`).toBe(solid[`${step}`]);
        }
      }
    }
  });
});

describe("затемнение под модальным слоем", () => {
  it("чёрное в ОБОИХ режимах — от режима оно не зависит", () => {
    // Осветляющая вуаль в тёмной теме не убирает содержимое из фокуса, а подсвечивает его.
    const scrim = buildScrim(DEFAULT_SEEDS.neutral);
    const { color, alpha } = readVeil(scrim);
    expect(color.r + color.g + color.b).toBeCloseTo(0, 6);
    expect(alpha).toBeGreaterThan(0.35);
    expect(alpha).toBeLessThan(0.75);
  });

  it("сила взята от шкалы, а не назначена: это перекрытие сплошного акцента", () => {
    const solid = buildScale(DEFAULT_SEEDS.neutral, "light");
    const expected = veilOver(
      oklchToSrgb(parseColor(solid["9"])),
      oklchToSrgb(parseColor(solid["1"])),
    );
    expect(readVeil(buildScrim(DEFAULT_SEEDS.neutral)).alpha).toBeCloseTo(expected.alpha, 6);
  });

  it("меняется вместе с нейтральной шкалой, а не живёт своей жизнью", () => {
    expect(buildScrim("oklch(0.2 0 0)")).not.toBe(buildScrim("oklch(0.8 0 0)"));
  });
});
