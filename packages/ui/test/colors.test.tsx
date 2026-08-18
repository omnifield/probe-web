// Гейт ВЫПОЛНИМОСТИ контракта: значение цветовых примитивов собирается, НЕ выходя за кит.
//
// Предмет здесь не `parseColor` сам по себе, а связка. Тип `Color` стоит в наших публичных
// пропах (`value`, `defaultValue`, `onChange` у `ColorArea` и `ColorSlider`), то есть он уже
// часть поверхности зоны, — а собрать такое значение потребителю было нечем: `parseColor` живёт
// у `@kobalte/core`, которого он не объявлял (`kb:PROBEWEB-17` — там замерено, почему на
// транзитивную установку опираться нельзя).
//
// Поэтому весь ввоз в этом файле идёт ИЗ ОДНОЙ точки — `../src/index.js`. Это не стиль: возьми
// тест `parseColor` откуда-нибудь ещё, и он был бы зелёным ровно в том случае, который мы
// проверяем, — когда контракт выполним только у того, кто угадал вторую зависимость.
//
// Решение и его основание — `kb:PROBEWEB-4`, поправка 2026-08-18 «средство собрать значение
// приезжает оттуда же, откуда контракт». Цена связи названа в `src/colors.ts`.

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ColorArea,
  ColorAreaBackground,
  ColorAreaThumb,
  ColorSlider,
  ColorSliderThumb,
  ColorSliderTrack,
  parseColor,
} from "../src/index.js";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("значение, собранное `parseColor` нашей поверхности", () => {
  it("принимает `ColorArea` — по обеим осям", () => {
    const host = mount(() => (
      <ColorArea value={parseColor("hsb(200, 20%, 40%)")} xChannel="saturation" yChannel="brightness">
        <ColorAreaBackground>
          <ColorAreaThumb />
        </ColorAreaBackground>
      </ColorArea>
    ));

    const thumb = one<HTMLElement>(host, "[data-slot='color-area-thumb']");

    // Ожидания — обычные числа, а не пересчёт тем же типом: сверка значения самим собой была бы
    // зелёной и на сломанном разборе.
    expect(thumb.style.left).toBe("20%");
    expect(thumb.style.top).toBe("60%");
  });

  it("принимает `ColorSlider` — канал читается из того же значения", () => {
    const host = mount(() => (
      <ColorSlider channel="hue" value={parseColor("hsl(200, 100%, 50%)")}>
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    ));

    expect(one(host, "[data-slot='color-slider-thumb']").getAttribute("aria-valuenow")).toBe("200");
  });

  it("собирается из ХЕКСА — того самого, что вводят в `ColorField`", () => {
    // Замыкание волны: строка из поля цвета становится значением области и ползунка и наружу
    // возвращается той же строкой. Прописные — написание `@kobalte/core`.
    expect(parseColor("#2f6fed").toString("hex")).toBe("#2F6FED");
  });

  it("хекс — это RGB, и канала `hue` в нём НЕТ: мост назван, а не подразумевается", () => {
    // Ловушка ровно на шве `ColorField` → `ColorSlider`, и найдена она этой пробой, а не
    // потребителем: `parseColor("#2f6fed")` даёт цвет в RGB, а `channel="hue"` живёт в HSL/HSB.
    // Без перевода kobalte бросает `Unknown color channel: hue` на РЕНДЕРЕ.
    expect(() =>
      mount(() => (
        <ColorSlider channel="hue" value={parseColor("#2f6fed")}>
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
        </ColorSlider>
      )),
    ).toThrow(/Unknown color channel/);
  });

  it("мостов ДВА, и оба целиком внутри нашей поверхности", () => {
    // Первый — `colorSpace` на корне: переводит примитив. Второй — `toFormat` на значении:
    // метод типа `Color`, то есть тоже наша поверхность, а не вторая зависимость.
    const bySpace = mount(() => (
      <ColorSlider channel="hue" colorSpace="hsl" value={parseColor("#2f6fed")}>
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    ));

    const byValue = mount(() => (
      <ColorSlider channel="hue" value={parseColor("#2f6fed").toFormat("hsl")}>
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    ));

    // Один и тот же тон, посчитанный двумя дорогами: расхождение означало бы, что потребителю
    // всё-таки надо выбирать правильную.
    for (const host of [bySpace, byValue]) {
      expect(one(host, "[data-slot='color-slider-thumb']").getAttribute("aria-valuenow")).toBe(
        "219.79",
      );
    }
  });

  it("ОДНО значение кормит оба примитива — ради этого связка и нужна", () => {
    // Настоящий подборщик цвета — это область и ползунок, смотрящие на общее значение.
    // Собрать его вне кита потребитель не мог, и до этой поправки связка была невыразима.
    const shared = parseColor("hsb(200, 20%, 40%)");

    const host = mount(() => (
      <>
        <ColorArea value={shared} xChannel="saturation" yChannel="brightness">
          <ColorAreaBackground>
            <ColorAreaThumb />
          </ColorAreaBackground>
        </ColorArea>
        <ColorSlider channel="hue" value={shared}>
          <ColorSliderTrack>
            <ColorSliderThumb />
          </ColorSliderTrack>
        </ColorSlider>
      </>
    ));

    expect(one<HTMLElement>(host, "[data-slot='color-area-thumb']").style.left).toBe("20%");
    expect(one(host, "[data-slot='color-slider-thumb']").getAttribute("aria-valuenow")).toBe("200");
  });

  it("обратно наружу приезжает ТОТ ЖЕ тип — иначе замкнуть на пресет нечем", () => {
    const onChange = vi.fn();
    const host = mount(() => (
      <ColorSlider channel="hue" value={parseColor("hsl(200, 100%, 50%)")} onChange={onChange}>
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSlider>
    ));

    const thumb = one(host, "[data-slot='color-slider-thumb']");
    thumb.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(onChange).toHaveBeenCalledTimes(1);
    // Не «что-то пришло», а «пришёл цвет, который умеет обратно в строку»: именно этим
    // значение кладут в пресет оформления.
    expect(onChange.mock.calls[0][0].toString("hex")).toMatch(/^#[0-9A-F]{6}$/);
  });
});
