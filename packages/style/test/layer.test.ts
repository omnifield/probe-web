import { describe, expect, it } from "vitest";

import { LAYERS, LAYER_TOKENS } from "../src/layer.js";
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

});

// РАЗДЕЛ «СЛОИ В ПОСТАВКЕ» СНЯТ (`PWEB-66`). Шкала слоёв больше не печатается в лист — базовый
// слой везёт только сброс. Порядок перекрытия остался ДАННЫМИ (`LAYERS`), и проверяется он
// выше: это контракт, а не строка в чужом файле.

// РАЗДЕЛ «СЛОИ В ПОСТАВКЕ» СНЯТ (`PWEB-66`): шкала слоёв больше не печатается в лист — базовый
// слой везёт только сброс. Ушли вместе с ним «шкала доехала в base.css» и «значения — числа
// без единиц»: обе спрашивали ТЕКСТ, которого нет.
//
// Обязательство, которое печати не касалось, осталось и переехало сюда.
describe("слои — данные, а не лист", () => {
  it("слои не тема: они одинаковы для всех палитр", () => {
    // Порядок перекрытия от бренда не зависит, и место ему в контракте, а не в палитре.
    for (const token of LAYER_TOKENS) {
      expect(SCALE_TOKENS).not.toContain(token);
      expect(THEME_META_TOKENS).not.toContain(token);
    }
  });

  it("значение слоя — целое число: `z-index` дробей и единиц не принимает", () => {
    // Прежде это проверялось по печатному виду (`--z-dialog: 40;`). Печати нет — спрашиваем
    // данные, и вопрос от этого стал прямее: печатать будет тот, кому шкала понадобится.
    for (const layer of LAYERS) {
      expect(Number.isInteger(layer.value), `слой --${layer.name}`).toBe(true);
      expect(String(layer.value)).toMatch(/^\d+$/);
    }
  });
});
