// Шкалы: арифметика, от которой зависит, врёт ли картинка.

import { describe, expect, it } from "vitest";

import { bandScale, linearScale } from "../src/chart/scale.js";

describe("линейная шкала", () => {
  it("края домена ложатся на края полосы", () => {
    const scale = linearScale(0, 100, [200, 0]);
    expect(scale.at(0)).toBe(200);
    expect(scale.at(100)).toBe(0);
    expect(scale.at(50)).toBe(100);
  });

  it("полоса развёрнута — потому что ось Y в SVG растёт ВНИЗ", () => {
    const scale = linearScale(0, 10, [100, 0]);
    expect(scale.at(10)).toBeLessThan(scale.at(0));
  });

  it("домен нулевой ширины не растягивается в бесконечность", () => {
    const scale = linearScale(5, 5, [100, 0]);
    expect(Number.isFinite(scale.at(5))).toBe(true);
    expect(scale.at(5)).toBe(50);
  });

  it("деления круглые, а не «0.30000000000000004»", () => {
    // Ось существует, чтобы по ней считывали величину, а не любовались точностью.
    expect(linearScale(0, 1, [0, 100]).ticks(4)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(linearScale(0, 1000, [0, 100]).ticks(4)).toEqual([0, 200, 400, 600, 800, 1000]);
  });

  it("деления не выходят за домен", () => {
    const ticks = linearScale(7, 93, [0, 100]).ticks(4);
    expect(ticks[0]).toBeGreaterThanOrEqual(7);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(93);
  });
});

describe("полосовая шкала", () => {
  it("делит полосу поровну и оставляет промежутки", () => {
    const band = bandScale(4, [0, 400], 0.2);
    expect(band.width).toBe(80);
    expect(band.center(0)).toBe(50);
    expect(band.center(3)).toBe(350);
    expect(band.at(0)).toBe(10);
  });

  it("без категорий не делит на ноль", () => {
    const band = bandScale(0, [0, 100]);
    expect(Number.isFinite(band.width)).toBe(true);
  });
});
