import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import {
  ColorSlider,
  ColorSliderDescription,
  ColorSliderError,
  ColorSliderInput,
  ColorSliderLabel,
  ColorSliderThumb,
  ColorSliderTrack,
  ColorSliderValueLabel,
} from "../src/color-slider.jsx";
import { parseColor } from "../src/colors.js";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Тон акцента — тот самый ползунок-радуга. */
function Hue(props: { value?: ReturnType<typeof parseColor>; invalid?: boolean }) {
  return (
    <ColorSlider
      channel="hue"
      value={props.value}
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <ColorSliderLabel>Тон</ColorSliderLabel>
      <ColorSliderValueLabel />
      <ColorSliderTrack>
        <ColorSliderThumb>
          <ColorSliderInput />
        </ColorSliderThumb>
      </ColorSliderTrack>
      <ColorSliderDescription>Цветовой круг</ColorSliderDescription>
      <ColorSliderError>Тон занят другой ступенью</ColorSliderError>
    </ColorSlider>
  );
}

describe("ColorSlider — узлы", () => {
  it("дорожка и бегунок вложены; внутри бегунка настоящий `input[type=range]`", () => {
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} />);

    const track = one(host, "[data-slot='color-slider-track']");
    const thumb = one(host, "[data-slot='color-slider-thumb']");

    expect(track.contains(thumb)).toBe(true);

    const input = one<HTMLInputElement>(host, "[data-slot='color-slider-input']");
    expect(input.type).toBe("range");
    expect(thumb.contains(input)).toBe(true);
  });

  it("заливки у цветового канала НЕТ — «пройденной части» здесь не бывает", () => {
    // Отличие от обычного ползунка, и оно по существу: дорожка значима на всём протяжении,
    // делить её на пройденную и остаток нечем.
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} />);

    expect(host.querySelector("[data-slot='color-slider-fill']")).toBeNull();
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} invalid={invalid()} />);

    expect(host.querySelector("[data-slot='color-slider-error']")).toBeNull();

    setInvalid(true);

    expect(one(host, "[data-slot='color-slider-error']").textContent).toBe(
      "Тон занят другой ступенью",
    );
  });
});

describe("ColorSlider — границы и значение берутся из КАНАЛА", () => {
  it("у тона это 0…360, и `minValue`/`maxValue` для этого не нужны", () => {
    // Ровно то, чего нельзя получить обычным `Slider`: границы знает цветовая модель, а не
    // потребитель. Ошибись он здесь — ползунок молча врал бы на краях.
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} />);
    const thumb = one(host, "[data-slot='color-slider-thumb']");

    expect(thumb.getAttribute("role")).toBe("slider");
    expect(thumb.getAttribute("aria-valuemin")).toBe("0");
    expect(thumb.getAttribute("aria-valuemax")).toBe("360");
    expect(thumb.getAttribute("aria-valuenow")).toBe("200");
  });

  it("значение меняется — бегунок и подпись едут следом", () => {
    const [value, setValue] = createSignal(parseColor("hsl(200, 100%, 50%)"));
    const host = mount(() => <Hue value={value()} />);
    const thumb = one(host, "[data-slot='color-slider-thumb']");
    const label = one(host, "[data-slot='color-slider-value-label']");

    const before = label.textContent;

    setValue(parseColor("hsl(20, 100%, 50%)"));

    expect(thumb.getAttribute("aria-valuenow")).toBe("20");
    expect(label.textContent).not.toBe(before);
  });

  it("вспомогательной технике объявлено НАЗВАНИЕ цвета, а не одно число", () => {
    // «240» само по себе не сообщает ничего. Название цвета считает `@kobalte/core` из
    // значения — повторить это в оформлении нечем.
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} />);
    const valueText = one(host, "[data-slot='color-slider-thumb']").getAttribute("aria-valuetext");

    expect(valueText).toBeTruthy();
    expect(valueText).not.toBe("200");
  });
});

describe("ColorSlider — названное отступление: цвет приезжает стилем", () => {
  it("дорожка несёт градиент канала — это значение примитива, а не вид", () => {
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} />);
    const track = one<HTMLElement>(host, "[data-slot='color-slider-track']");

    expect(track.style.background).toContain("gradient");
  });

  it("стиль потребителя СЛИВАЕТСЯ с нашим, а не затирается им", () => {
    const host = mount(() => (
      <ColorSlider channel="hue" value={parseColor("hsl(200, 100%, 50%)")}>
        <ColorSliderTrack style={{ height: "12px" }} />
      </ColorSlider>
    ));

    const track = one<HTMLElement>(host, "[data-slot='color-slider-track']");

    expect(track.style.height).toBe("12px");
    expect(track.style.background).toContain("gradient");
  });

  it("выбранный цвет отдан оформлению переменной — красить бегунок нечем иначе", () => {
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} />);
    const thumb = one<HTMLElement>(host, "[data-slot='color-slider-thumb']");

    expect(thumb.style.getPropertyValue("--kb-color-current")).not.toBe("");
  });
});

describe("ColorSlider — стилей по умолчанию нет", () => {
  it("класса нет ни у одной части", () => {
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} invalid />);

    const parts = host.querySelectorAll("[data-slot^='color-slider']");
    expect(parts.length).toBe(8);

    for (const node of parts) expect(node.hasAttribute("class")).toBe(false);
  });

  it("вида в служебном стиле нет — ни у корня, ни у подписей", () => {
    const host = mount(() => <Hue value={parseColor("hsl(200, 100%, 50%)")} invalid />);

    for (const slot of ["color-slider", "color-slider-label", "color-slider-value-label"]) {
      expect(one(host, `[data-slot='${slot}']`).hasAttribute("style")).toBe(false);
    }
  });
});
