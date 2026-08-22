import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { LAYERS, LAYER_TOKENS, layerCss } from "../src/layer.js";
import { SCALE_TOKENS, THEME_META_TOKENS } from "../src/tokens.js";

// Порядок слоёв — КОНТРАКТ, а не деталь реализации компонента. Пока слой один, `z-index: 1`
// работает; при четырёх слоях число из головы спорит с чужим числом из головы, и выигрывает
// тот, кто написал больше. Поэтому порядок здесь проверяется машиной.

const order = (name: string): number => {
  const layer = LAYERS.find((item) => item.name === name);
  expect(layer, `слой --${name} объявлен`).toBeDefined();
  return layer!.value;
};

describe("шкала слоёв", () => {
  it("порядок объявлен и строго возрастает", () => {
    const values = LAYERS.map((layer) => layer.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(new Set(values).size).toBe(values.length);
  });

  it("четыре слоя, ради которых шкала заведена, идут в обещанном порядке", () => {
    // Панель списка · поповер · диалог · уведомление — заявка зоны `skin`.
    expect(order("z-dropdown")).toBeLessThan(order("z-popover"));
    expect(order("z-popover")).toBeLessThan(order("z-dialog"));
    expect(order("z-dialog")).toBeLessThan(order("z-toast"));
  });

  it("затемнение лежит НИЖЕ модального слоя и ВЫШЕ всего остального", () => {
    // Иначе оно либо закрывает диалог, либо не отделяет его от страницы.
    expect(order("z-overlay")).toBeGreaterThan(order("z-popover"));
    expect(order("z-overlay")).toBeLessThan(order("z-dialog"));
  });

  it("между слоями оставлено место для чужого", () => {
    // Потребитель, которому нужен слой между поповером и диалогом, вписывает своё число и не
    // просит нас перенумеровать шкалу.
    const gaps = LAYERS.slice(1).map((layer, index) => layer.value - LAYERS[index].value);
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(10);
  });

  it("у каждого слоя названо, что именно на нём лежит", () => {
    for (const layer of LAYERS) expect(layer.purpose.length).toBeGreaterThan(10);
  });

  it("слои — целые числа, а не строки и не дроби", () => {
    for (const layer of LAYERS) expect(Number.isInteger(layer.value)).toBe(true);
  });
});

describe("слои в поставке", () => {
  const built = readFileSync(resolve(import.meta.dirname, "../dist/css/base.css"), "utf8");

  it("шкала доехала в base.css", () => {
    for (const token of LAYER_TOKENS) expect(built).toContain(`--${token}:`);
  });

  it("слои — не тема: они одинаковы для всех палитр", () => {
    // Порядок слоёв от бренда не зависит, и место ему в базе, а не в каждой палитре. Прежде
    // здесь стерёгся и третий перечень — роли; ролей больше нет (`PWEB-61`).
    for (const token of LAYER_TOKENS) {
      expect(SCALE_TOKENS).not.toContain(token);
      expect(THEME_META_TOKENS).not.toContain(token);
    }
  });

  it("значения — числа без единиц: `z-index` их не принимает", () => {
    expect(layerCss()).toMatch(/--z-dialog: \d+;/);
  });
});
