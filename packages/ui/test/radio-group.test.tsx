import { For, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupError,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemIndicator,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupLabel,
} from "../src/radio-group.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

const SIZES = ["S", "M", "L"];

/** Полная сборка группы — та же, что стоит примером в доке компонента. */
function Size(props: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <RadioGroup
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <RadioGroupLabel>Размер</RadioGroupLabel>
      <RadioGroupDescription>Как в таблице размеров</RadioGroupDescription>
      <RadioGroupError>Размер не выбран</RadioGroupError>
      <For each={SIZES}>
        {(size) => (
          <RadioGroupItem value={size}>
            <RadioGroupItemInput />
            <RadioGroupItemControl>
              <RadioGroupItemIndicator />
            </RadioGroupItemControl>
            <RadioGroupItemLabel>{size}</RadioGroupItemLabel>
            <RadioGroupItemDescription>вариант {size}</RadioGroupItemDescription>
          </RadioGroupItem>
        )}
      </For>
    </RadioGroup>
  );
}

describe("RadioGroup — два уровня, и каждая часть ОДИН узел", () => {
  it("корень объявлен группой переключателей", () => {
    const host = mount(() => <Size />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("role")).toBe("radiogroup");
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("radio-group");
  });

  it("вариантов столько, сколько дал потребитель, — группа их не придумывает", () => {
    const host = mount(() => <Size />);

    expect(host.querySelectorAll("[data-slot='radio-group-item']").length).toBe(3);
    expect(
      [...host.querySelectorAll("[data-slot='radio-group-item-label']")].map(
        (node) => node.textContent,
      ),
    ).toEqual(SIZES);
  });

  it("подпись ГРУППЫ — `span`, и она уезжает в `aria-labelledby` корня", () => {
    // Не `label`: подпись относится ко всем вариантам сразу, а `for` связывает с одним.
    const host = mount(() => <Size />);
    const label = one(host, "[data-slot='radio-group-label']");

    expect(label.tagName).toBe("SPAN");
    expect(host.firstElementChild?.getAttribute("aria-labelledby")).toContain(label.id);
  });

  it("у варианта свой настоящий `input[type=radio]` и своя подпись", () => {
    const host = mount(() => <Size />);
    const input = one<HTMLInputElement>(host, "[data-slot='radio-group-item-input']");
    const label = one<HTMLLabelElement>(host, "[data-slot='radio-group-item-label']");

    expect(input.type).toBe("radio");
    expect(label.tagName).toBe("LABEL");
    expect(label.htmlFor).toBe(input.id);
  });

  it("все варианты в одной группе формы — общий `name`", () => {
    const host = mount(() => <Size />);
    const names = [...host.querySelectorAll<HTMLInputElement>("input")].map((node) => node.name);

    expect(new Set(names).size).toBe(1);
    expect(names[0]).not.toBe("");
  });
});

describe("RadioGroup — выбор", () => {
  it("отметка рендерится ТОЛЬКО у выбранного варианта", () => {
    const [value, setValue] = createSignal("");
    const host = mount(() => <Size value={value()} onChange={setValue} />);

    expect(host.querySelectorAll("[data-slot='radio-group-item-indicator']").length).toBe(0);

    setValue("M");

    const indicators = host.querySelectorAll("[data-slot='radio-group-item-indicator']");
    expect(indicators.length).toBe(1);
    // И стоит она именно у выбранного, а не у первого попавшегося.
    expect(indicators[0].closest("[data-slot='radio-group-item']")?.textContent).toContain("M");
  });

  it("выбор варианта зовёт `onChange` со значением", () => {
    const onChange = vi.fn();
    const host = mount(() => <Size onChange={onChange} />);

    one<HTMLInputElement>(host, "[data-slot='radio-group-item-input']").click();

    expect(onChange).toHaveBeenCalledWith("S");
  });

  it("управляемое значение приходит снаружи, а не из клика", () => {
    const [value, setValue] = createSignal("S");
    const host = mount(() => <Size value={value()} />);
    const items = () => [...host.querySelectorAll("[data-slot='radio-group-item']")];

    expect(items().find((node) => node.hasAttribute("data-checked"))?.textContent).toContain("S");

    setValue("L");

    expect(items().find((node) => node.hasAttribute("data-checked"))?.textContent).toContain("L");
  });

  it("отключённая группа не выбирается", () => {
    const onChange = vi.fn();
    const host = mount(() => <Size disabled onChange={onChange} />);

    one<HTMLInputElement>(host, "[data-slot='radio-group-item-input']").click();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("ошибка ГРУППЫ — одна на всех и только при `invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Size invalid={invalid()} />);

    expect(host.querySelector("[data-slot='radio-group-error']")).toBeNull();

    setInvalid(true);

    expect(host.querySelectorAll("[data-slot='radio-group-error']").length).toBe(1);
  });
});

describe("RadioGroup — стилей по умолчанию нет, кроме названного отступления", () => {
  it("ни одна часть не приносит класса, а стиль — только у спрятанных вводов", () => {
    const host = mount(() => <Size value="M" invalid />);

    for (const node of host.querySelectorAll("[data-slot^='radio-group']")) {
      expect(node.hasAttribute("class")).toBe(false);

      if (node.getAttribute("data-slot") !== "radio-group-item-input") {
        expect(node.hasAttribute("style")).toBe(false);
      }
    }
  });

  it("спрятанный ввод варианта унесён из вида, а не оформлен", () => {
    // Третье появление того же отступления — разбор в `test/checkbox.test.tsx`.
    const style = one(mount(() => <Size />), "[data-slot='radio-group-item-input']").getAttribute(
      "style",
    );

    expect(style).toContain("position: absolute");
    expect(style).not.toMatch(/color|background|font|radius/);
  });
});
