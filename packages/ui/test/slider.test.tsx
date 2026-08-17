import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import {
  Slider,
  SliderDescription,
  SliderError,
  SliderFill,
  SliderInput,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from "../src/slider.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Цена «от и до» — диапазон из двух бегунков. */
function Price(props: { value?: number[]; invalid?: boolean }) {
  return (
    <Slider
      value={props.value}
      minValue={0}
      maxValue={100}
      validationState={props.invalid ? "invalid" : "valid"}
      getValueLabel={(params) => `${params.values[0]} — ${params.values[1]}`}
    >
      <SliderLabel>Цена</SliderLabel>
      <SliderValueLabel />
      <SliderTrack>
        <SliderFill />
        <SliderThumb>
          <SliderInput />
        </SliderThumb>
        <SliderThumb>
          <SliderInput />
        </SliderThumb>
      </SliderTrack>
      <SliderDescription>В рублях</SliderDescription>
      <SliderError>Верхняя граница ниже нижней</SliderError>
    </Slider>
  );
}

describe("Slider — узлы", () => {
  it("диапазон — это ДВА бегунка внутри одного корня", () => {
    // Вот почему бегунок отдельная часть, а не проп: фильтр «от и до» собирается тем же
    // примитивом, без второго компонента.
    const host = mount(() => <Price value={[10, 90]} />);

    const thumbs = host.querySelectorAll("[data-slot='slider-thumb']");
    expect(thumbs.length).toBe(2);
    expect(thumbs[0].getAttribute("role")).toBe("slider");
  });

  it("внутри бегунка настоящий `input[type=range]` — он несёт фокус и клавиатуру", () => {
    const host = mount(() => <Price value={[10, 90]} />);
    const input = one<HTMLInputElement>(host, "[data-slot='slider-input']");

    expect(input.type).toBe("range");
    expect(input.closest("[data-slot='slider-thumb']")).not.toBeNull();
  });

  it("дорожка, заливка и бегунок — три РАЗНЫХ узла", () => {
    const host = mount(() => <Price value={[10, 90]} />);
    const track = one(host, "[data-slot='slider-track']");

    expect(track.contains(one(host, "[data-slot='slider-fill']"))).toBe(true);
    expect(track.contains(one(host, "[data-slot='slider-thumb']"))).toBe(true);
  });

  it("значение текстом пишет `getValueLabel`, а не кит", () => {
    const host = mount(() => <Price value={[10, 90]} />);

    expect(one(host, "[data-slot='slider-value-label']").textContent).toBe("10 — 90");
  });
});

describe("Slider — значение", () => {
  it("положение бегунка приезжает от kobalte, а не из оформления", () => {
    const [value, setValue] = createSignal([10, 90]);
    const host = mount(() => <Price value={value()} />);
    const thumb = one(host, "[data-slot='slider-thumb']");

    expect(thumb.getAttribute("aria-valuenow")).toBe("10");

    setValue([30, 90]);

    expect(thumb.getAttribute("aria-valuenow")).toBe("30");
    // Заливка — узел со своим стилем: долю считает kobalte, вид пишет оформление.
    expect(one(host, "[data-slot='slider-fill']").hasAttribute("style")).toBe(true);
  });

  it("границы объявлены на бегунке — это границы ВСЕГО ползунка, а не соседа", () => {
    // Проверка ровно того, что есть: `aria-valuemax` у первого бегунка равен максимуму
    // ползунка (100), а не значению второго бегунка. Соседа kobalte учитывает при
    // перетаскивании, но в разметку это не выносит — оформлению знать про соседа неоткуда.
    const host = mount(() => <Price value={[10, 90]} />);
    const thumb = one(host, "[data-slot='slider-thumb']");

    expect(thumb.getAttribute("aria-valuemin")).toBe("0");
    expect(thumb.getAttribute("aria-valuemax")).toBe("100");
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Price value={[10, 90]} invalid={invalid()} />);

    expect(host.querySelector("[data-slot='slider-error']")).toBeNull();

    setInvalid(true);

    expect(one(host, "[data-slot='slider-error']").textContent).toBe("Верхняя граница ниже нижней");
  });
});

describe("Slider — стилей по умолчанию нет", () => {
  it("класса нет ни у одной части", () => {
    const host = mount(() => <Price value={[10, 90]} invalid />);

    const parts = host.querySelectorAll("[data-slot^='slider']");
    expect(parts.length).toBeGreaterThan(6);

    for (const node of parts) expect(node.hasAttribute("class")).toBe(false);
  });

  it("служебный стиль есть только у заливки и бегунков — это положение, а не вид", () => {
    const host = mount(() => <Price value={[10, 90]} />);

    for (const slot of ["slider-fill", "slider-thumb"]) {
      const style = one(host, `[data-slot='${slot}']`).getAttribute("style") ?? "";
      expect(style).not.toMatch(/color|background|font|radius|border/);
    }

    expect(one(host, "[data-slot='slider-track']").hasAttribute("style")).toBe(false);
  });
});
