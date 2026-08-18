import { parseColor } from "@kobalte/core/colors";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import {
  ColorArea,
  ColorAreaBackground,
  ColorAreaDescription,
  ColorAreaError,
  ColorAreaHiddenInputX,
  ColorAreaHiddenInputY,
  ColorAreaLabel,
  ColorAreaThumb,
} from "../src/color-area.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Квадрат подбора оттенка: насыщенность по оси X, яркость по оси Y. */
function Picker(props: { value?: ReturnType<typeof parseColor>; invalid?: boolean }) {
  return (
    <ColorArea
      value={props.value}
      xChannel="saturation"
      yChannel="brightness"
      xName="s"
      yName="b"
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <ColorAreaLabel>Оттенок</ColorAreaLabel>
      <ColorAreaBackground>
        <ColorAreaThumb>
          <ColorAreaHiddenInputX />
          <ColorAreaHiddenInputY />
        </ColorAreaThumb>
      </ColorAreaBackground>
      <ColorAreaDescription>Тяните по квадрату</ColorAreaDescription>
      <ColorAreaError>Слишком тёмный</ColorAreaError>
    </ColorArea>
  );
}

describe("ColorArea — узлы", () => {
  it("подложка, бегунок и два скрытых ввода — вложены, а не разложены рядом", () => {
    // Вложенность здесь не украшение: координаты бегунка считаются в процентах от размеров
    // подложки, а вводы обязаны быть внутри бегунка, чтобы фокус вёл к нему.
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} />);

    const background = one(host, "[data-slot='color-area-background']");
    const thumb = one(host, "[data-slot='color-area-thumb']");

    expect(background.contains(thumb)).toBe(true);
    expect(thumb.contains(one(host, "[data-slot='color-area-hidden-input-x']"))).toBe(true);
    expect(thumb.contains(one(host, "[data-slot='color-area-hidden-input-y']"))).toBe(true);
  });

  it("корень — группа, бегунок из разметки исключён: его роль несут вводы", () => {
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} />);

    expect(one(host, "[data-slot='color-area']").getAttribute("role")).toBe("group");
    expect(one(host, "[data-slot='color-area-thumb']").getAttribute("role")).toBe("presentation");

    const x = one<HTMLInputElement>(host, "[data-slot='color-area-hidden-input-x']");
    expect(x.type).toBe("range");
  });

  it("каналов два — значит и вводов два, каждый со своим именем формы", () => {
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} />);

    const x = one<HTMLInputElement>(host, "[data-slot='color-area-hidden-input-x']");
    const y = one<HTMLInputElement>(host, "[data-slot='color-area-hidden-input-y']");

    expect(x.name).toBe("s");
    expect(y.name).toBe("b");
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => (
      <Picker value={parseColor("hsb(200, 50%, 50%)")} invalid={invalid()} />
    ));

    expect(host.querySelector("[data-slot='color-area-error']")).toBeNull();

    setInvalid(true);

    expect(one(host, "[data-slot='color-area-error']").textContent).toBe("Слишком тёмный");
  });
});

describe("ColorArea — значение", () => {
  it("положение бегунка приезжает от kobalte, а не из оформления", () => {
    const [value, setValue] = createSignal(parseColor("hsb(200, 20%, 40%)"));
    const host = mount(() => <Picker value={value()} />);
    const thumb = one<HTMLElement>(host, "[data-slot='color-area-thumb']");

    // Ось Y перевёрнута: яркость растёт вверх, а `top` считается сверху.
    expect(thumb.style.left).toBe("20%");
    expect(thumb.style.top).toBe("60%");

    setValue(parseColor("hsb(200, 80%, 40%)"));

    expect(thumb.style.left).toBe("80%");
  });

  it("выбранный цвет отдан оформлению переменной, а не разобранным по каналам", () => {
    // `--kb-color-current` — это и есть способ покрасить бегунок, не разбирая цветовые модели
    // в CSS: `background: var(--kb-color-current)`.
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} />);
    const thumb = one<HTMLElement>(host, "[data-slot='color-area-thumb']");

    expect(thumb.style.getPropertyValue("--kb-color-current")).not.toBe("");
  });
});

describe("ColorArea — названное отступление: цвет приезжает стилем", () => {
  it("подложка несёт градиенты — это значение примитива, а не вид", () => {
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} />);
    const background = one<HTMLElement>(host, "[data-slot='color-area-background']");

    // Именно градиент, а не «какой-то стиль»: показывать нужно те цвета, между которыми
    // выбирают, а знает их только примитив.
    expect(background.style.background).toContain("gradient");
    // И жест: без этого прокрутка страницы съедала бы перетаскивание на телефоне.
    expect(background.style.getPropertyValue("touch-action")).toBe("none");
  });

  it("стиль потребителя СЛИВАЕТСЯ с нашим, а не затирается им", () => {
    // Обратная сторона отступления: размер, скругление и рамка остаются работой оформления.
    const host = mount(() => (
      <ColorArea value={parseColor("hsb(200, 50%, 50%)")}>
        <ColorAreaBackground style={{ "border-radius": "8px" }} />
      </ColorArea>
    ));

    const background = one<HTMLElement>(host, "[data-slot='color-area-background']");

    expect(background.style.borderRadius).toBe("8px");
    expect(background.style.background).toContain("gradient");
  });
});

describe("ColorArea — стилей по умолчанию нет", () => {
  it("класса нет ни у одной части", () => {
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} invalid />);

    const parts = host.querySelectorAll("[data-slot^='color-area']");
    expect(parts.length).toBe(8);

    for (const node of parts) expect(node.hasAttribute("class")).toBe(false);
  });

  it("вида в служебном стиле нет — ни у корня, ни у подписи, ни у пояснения", () => {
    const host = mount(() => <Picker value={parseColor("hsb(200, 50%, 50%)")} invalid />);

    for (const slot of ["color-area", "color-area-label", "color-area-description"]) {
      expect(one(host, `[data-slot='${slot}']`).hasAttribute("style")).toBe(false);
    }
  });
});
