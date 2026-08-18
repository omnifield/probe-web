import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ColorField,
  ColorFieldDescription,
  ColorFieldError,
  ColorFieldInput,
  ColorFieldLabel,
} from "../src/color-field.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Ввод акцента пресета — то, ради чего примитив и портирован. */
function Accent(props: {
  value?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
}) {
  return (
    <ColorField
      value={props.value}
      onChange={props.onChange}
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <ColorFieldLabel>Акцент</ColorFieldLabel>
      <ColorFieldInput onBlur={props.onBlur} />
      <ColorFieldDescription>Шестнадцатеричный</ColorFieldDescription>
      <ColorFieldError>Слишком светлый для текста</ColorFieldError>
    </ColorField>
  );
}

/** Печать в поле: значение узла плюс событие, как в браузере. */
function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("ColorField — узлы", () => {
  it("пять частей, и каждая ровно ОДИН узел", () => {
    const host = mount(() => <Accent value="#2f6fed" invalid />);

    expect(one(host, "[data-slot='color-field']").tagName).toBe("DIV");
    expect(one(host, "[data-slot='color-field-label']").tagName).toBe("LABEL");
    expect(one(host, "[data-slot='color-field-input']").tagName).toBe("INPUT");

    // Ровно по одному узлу на часть: обёртка своих узлов не приводит.
    for (const slot of ["color-field", "color-field-label", "color-field-input"]) {
      expect(host.querySelectorAll(`[data-slot='${slot}']`).length).toBe(1);
    }
  });

  it("подпись связана с вводом по контексту корня, а не руками потребителя", () => {
    const host = mount(() => <Accent value="#2f6fed" />);
    const label = one<HTMLLabelElement>(host, "[data-slot='color-field-label']");
    const input = one<HTMLInputElement>(host, "[data-slot='color-field-input']");

    expect(label.getAttribute("for")).toBe(input.id);
    expect(input.id).not.toBe("");
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Accent value="#2f6fed" invalid={invalid()} />);

    expect(host.querySelector("[data-slot='color-field-error']")).toBeNull();

    setInvalid(true);

    expect(one(host, "[data-slot='color-field-error']").textContent).toBe(
      "Слишком светлый для текста",
    );
  });
});

describe("ColorField — значение строкой", () => {
  it("посторонние знаки в поле НЕ попадают — а не подсвечиваются ошибкой после", () => {
    // Предмет проверки: фильтр стоит на вводе, а не на проверке при отправке. Потребителю
    // иначе пришлось бы писать его самому в каждом месте, где вводят цвет.
    const onChange = vi.fn();
    const host = mount(() => <Accent value="" onChange={onChange} />);
    const input = one<HTMLInputElement>(host, "[data-slot='color-field-input']");

    type(input, "зелёный");
    expect(onChange).not.toHaveBeenCalled();

    type(input, "#2f6fed");
    expect(onChange).toHaveBeenCalledWith("#2f6fed");

    // Семь цифр — уже за пределом: цвет шестизначный.
    onChange.mockClear();
    type(input, "#2f6fed0");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("на уходе фокуса значение приводится к `#RRGGBB` — прописными", () => {
    // Регистр назван в проверке НАРОЧНО: `@kobalte/core` пишет прописными, и потребитель,
    // сравнивающий значения строкой, обязан знать об этом до выпуска, а не после.
    const [value, setValue] = createSignal("f00");
    const onChange = vi.fn(setValue);
    const host = mount(() => <Accent value={value()} onChange={onChange} />);

    one(host, "[data-slot='color-field-input']").dispatchEvent(new FocusEvent("blur"));

    expect(onChange).toHaveBeenLastCalledWith("#FF0000");
  });

  it("неразобранное на уходе фокуса откатывается к прежнему, а не остаётся мусором", () => {
    const [value, setValue] = createSignal("#2f6fed");
    const onChange = vi.fn(setValue);
    const host = mount(() => <Accent value={value()} onChange={onChange} />);
    const input = one<HTMLInputElement>(host, "[data-slot='color-field-input']");

    // Приведение к цвету случается на уходе фокуса, поэтому сначала фиксируем прежнее
    // значение как «уже разобранное», а потом набираем недописанное.
    input.dispatchEvent(new FocusEvent("blur"));
    type(input, "#2f");
    expect(onChange).toHaveBeenLastCalledWith("#2f");

    input.dispatchEvent(new FocusEvent("blur"));

    expect(onChange).toHaveBeenLastCalledWith("#2F6FED");
  });
});

describe("ColorField — контракт зоны", () => {
  it("`onBlur` потребителя вызывается ВМЕСТЕ с внутренним, а не вместо", () => {
    // Мутационная проверка ровно этого места: замени `composeEventHandlers` в порте на
    // передачу только своего обработчика — приведение значения пропадёт, и второе
    // утверждение покраснеет, оставив первое зелёным.
    const onBlur = vi.fn();
    const [value, setValue] = createSignal("f00");
    const onChange = vi.fn(setValue);
    const host = mount(() => <Accent value={value()} onChange={onChange} onBlur={onBlur} />);

    one(host, "[data-slot='color-field-input']").dispatchEvent(new FocusEvent("blur"));

    expect(onBlur).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith("#FF0000");
  });

  it("служебные атрибуты ввода приезжают — и перебиваются потребителем", () => {
    const host = mount(() => (
      <ColorField>
        <ColorFieldInput />
        <ColorFieldInput autocomplete="on" data-slot="свой-ввод" />
      </ColorField>
    ));

    const ours = one<HTMLInputElement>(host, "[data-slot='color-field-input']");
    expect(ours.getAttribute("autocomplete")).toBe("off");
    expect(ours.getAttribute("spellcheck")).toBe("false");

    const theirs = one<HTMLInputElement>(host, "[data-slot='свой-ввод']");
    expect(theirs.getAttribute("autocomplete")).toBe("on");
  });

  it("ни класса, ни стиля по умолчанию — ни у одной части", () => {
    const host = mount(() => <Accent value="#2f6fed" invalid />);

    const parts = host.querySelectorAll("[data-slot^='color-field']");
    expect(parts.length).toBe(5);

    for (const node of parts) {
      expect(node.hasAttribute("class")).toBe(false);
      expect(node.hasAttribute("style")).toBe(false);
    }
  });
});
