import { describe, expect, it } from "vitest";

import {
  formatOklch,
  inSrgbGamut,
  oklchToSrgb,
  srgbToOklch,
  toSrgbGamut,
} from "../src/color/oklch.js";
import { parseColor } from "../src/color/parse.js";

// Цветовая математика — фундамент гейта контраста: ошибка здесь делает ЗЕЛЁНЫМ несоответствие,
// а это хуже красного прогона. Поэтому проверяем не «функция что-то вернула», а известные
// точки нормы: sRGB-примитивы, обход туда-обратно и поведение вне охвата.

describe("перевод в sRGB", () => {
  it("белый, чёрный и средний серый ложатся на известные точки", () => {
    const white = oklchToSrgb({ l: 1, c: 0, h: 0 });
    expect([white.r, white.g, white.b].map((v) => Number(v.toFixed(6)))).toEqual([1, 1, 1]);
    const black = oklchToSrgb({ l: 0, c: 0, h: 0 });
    expect([black.r, black.g, black.b]).toEqual([0, 0, 0]);

    // Серый 50% в sRGB — светлота примерно 0.5983 по Oklab (Оттоссон, 2020).
    const grey = oklchToSrgb({ l: 0.5983, c: 0, h: 0 });
    expect(grey.r).toBeCloseTo(0.5, 2);
    expect(grey.r).toBe(grey.g);
    expect(grey.g).toBe(grey.b);
  });

  it("обход sRGB → OKLCH → sRGB возвращает исходный цвет", () => {
    for (const source of [
      { r: 1, g: 0, b: 0 },
      { r: 0, g: 0.5, b: 0.25 },
      { r: 0.12, g: 0.34, b: 0.89 },
    ]) {
      const back = oklchToSrgb(srgbToOklch(source));
      expect(back.r).toBeCloseTo(source.r, 6);
      expect(back.g).toBeCloseTo(source.g, 6);
      expect(back.b).toBeCloseTo(source.b, 6);
    }
  });

  it("у ахроматичного цвета тон не додумывается", () => {
    expect(srgbToOklch({ r: 0.4, g: 0.4, b: 0.4 }).h).toBe(0);
  });
});

describe("охват sRGB", () => {
  it("цветность вне охвата уменьшается, светлота и тон остаются", () => {
    const wild = { l: 0.7, c: 0.35, h: 150 };
    expect(inSrgbGamut(wild)).toBe(false);

    const mapped = toSrgbGamut(wild);
    expect(mapped.l).toBe(wild.l);
    expect(mapped.h).toBe(wild.h);
    expect(mapped.c).toBeLessThan(wild.c);
    expect(inSrgbGamut(mapped)).toBe(true);
  });

  it("цвет в охвате не трогается вовсе", () => {
    const calm = { l: 0.6, c: 0.05, h: 200 };
    expect(toSrgbGamut(calm)).toBe(calm);
  });

  it("сериализация отображает в охват — в CSS не уезжает то, что браузер обрежет по-своему", () => {
    // Обрезка браузером меняет СВЕТЛОТУ, а на ней держится обещание контраста: посчитали бы
    // одно, показали другое.
    const value = formatOklch({ l: 0.7, c: 0.35, h: 150 });
    expect(inSrgbGamut(parseColor(value))).toBe(true);
  });
});

// Разбор текста живёт в `src/color/parse.ts` и проверяется `test/parse.test.ts` — здесь только
// то, что читает ЗАПИСАННОЕ нами же: сериализация обязана переживать обход туда-обратно.
describe("запись", () => {
  it("запись округляет и не тащит хвост двойной точности", () => {
    expect(formatOklch({ l: 2 / 3, c: 0.043216, h: 200.987654 })).toBe(
      "oklch(0.6667 0.0432 200.99)",
    );
  });

  it("у серого тон записывается нулём — одинаковые цвета не должны отличаться текстом", () => {
    expect(formatOklch({ l: 0.5, c: 0, h: 137 })).toBe("oklch(0.5 0 0)");
  });
});
