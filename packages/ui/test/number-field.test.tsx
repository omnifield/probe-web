import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldDescription,
  NumberFieldError,
  NumberFieldHiddenInput,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldLabel,
} from "../src/number-field.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Количество — сборка, та же что в доке компонента. */
function Count(props: {
  value?: number;
  onRawValueChange?: (value: number) => void;
  minValue?: number;
  invalid?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
}) {
  return (
    <NumberField
      rawValue={props.value}
      onRawValueChange={props.onRawValueChange}
      minValue={props.minValue}
      formatOptions={props.formatOptions}
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <NumberFieldLabel>Количество</NumberFieldLabel>
      <NumberFieldDecrement>−</NumberFieldDecrement>
      <NumberFieldInput />
      <NumberFieldIncrement>+</NumberFieldIncrement>
      <NumberFieldHiddenInput />
      <NumberFieldDescription>Штук в заказе</NumberFieldDescription>
      <NumberFieldError>Не меньше нуля</NumberFieldError>
    </NumberField>
  );
}

describe("NumberField — узлы", () => {
  it("кнопки — настоящие `<button>`, а не стрелки браузера", () => {
    // Ради этого примитив и существует: нативные стрелки `input[type=number]` не
    // стилизуются и ведут себя в каждом браузере по-своему.
    const host = mount(() => <Count value={1} />);

    expect(one(host, "[data-slot='number-field-increment']").tagName).toBe("BUTTON");
    expect(one(host, "[data-slot='number-field-decrement']").tagName).toBe("BUTTON");
  });

  it("подпись связана с вводом, пояснение уезжает в `aria-describedby`", () => {
    const host = mount(() => <Count value={1} />);
    const input = one<HTMLInputElement>(host, "[data-slot='number-field-input']");

    expect(one<HTMLLabelElement>(host, "[data-slot='number-field-label']").htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toContain(
      one(host, "[data-slot='number-field-description']").id,
    );
  });

  it("видимый ввод показывает ФОРМАТ, скрытый уносит в форму сырое число", () => {
    const host = mount(() => (
      <Count value={1234.5} formatOptions={{ style: "decimal", minimumFractionDigits: 2 }} />
    ));

    const visible = one<HTMLInputElement>(host, "[data-slot='number-field-input']");
    const hidden = one<HTMLInputElement>(host, "[data-slot='number-field-hidden-input']");

    // Отформатированную строку сервер не разберёт — вот зачем нужен второй ввод.
    expect(visible.value).not.toBe("1234.5");
    expect(visible.value).toContain("1");
    expect(hidden.value).toBe("1234.5");
  });
});

describe("NumberField — значение", () => {
  it("кнопка «больше» увеличивает и зовёт `onRawValueChange`", () => {
    const onRawValueChange = vi.fn();
    const host = mount(() => <Count value={1} onRawValueChange={onRawValueChange} />);

    press(one(host, "[data-slot='number-field-increment']"));

    expect(onRawValueChange).toHaveBeenCalledWith(2);
  });

  it("кнопка «меньше» уменьшает", () => {
    const onRawValueChange = vi.fn();
    const host = mount(() => <Count value={1} onRawValueChange={onRawValueChange} />);

    press(one(host, "[data-slot='number-field-decrement']"));

    expect(onRawValueChange).toHaveBeenCalledWith(0);
  });

  it("граница снизу держится примитивом: значение не уходит за `minValue`", () => {
    // Важная деталь для потребителя: кнопка на границе НЕ отключается и обработчик всё равно
    // зовётся — но значением границы, а не запретным. Проверка «кнопка disabled» была бы
    // ложной, а «обработчик не позвали» — тем более.
    const onRawValueChange = vi.fn();
    const host = mount(() => <Count value={0} minValue={0} onRawValueChange={onRawValueChange} />);

    press(one(host, "[data-slot='number-field-decrement']"));

    expect(onRawValueChange).not.toHaveBeenCalledWith(-1);
    for (const [value] of onRawValueChange.mock.calls) expect(value).toBeGreaterThanOrEqual(0);
  });

  it("управляемое значение приходит снаружи", () => {
    const [value, setValue] = createSignal(1);
    const host = mount(() => <Count value={value()} />);
    const input = one<HTMLInputElement>(host, "[data-slot='number-field-input']");

    expect(input.value).toBe("1");

    setValue(7);

    expect(input.value).toBe("7");
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Count value={1} invalid={invalid()} />);

    expect(host.querySelector("[data-slot='number-field-error']")).toBeNull();

    setInvalid(true);

    expect(one(host, "[data-slot='number-field-error']").textContent).toBe("Не меньше нуля");
  });
});

describe("NumberField — стилей по умолчанию нет", () => {
  it("ни одна часть не приносит своего класса", () => {
    const host = mount(() => <Count value={1} invalid />);

    const parts = host.querySelectorAll("[data-slot^='number-field']");
    expect(parts.length).toBe(8);

    for (const node of parts) expect(node.hasAttribute("class")).toBe(false);
  });

  it("на видимом вводе есть служебный стиль, и он ровно один", () => {
    // `touch-action: none` ставит kobalte: иначе жест прокрутки по полю менял бы значение —
    // ровно та беда нативного `input[type=number]`, от которой этот примитив и уходит.
    // Ни цвета, ни размеров: вид пишет оформление.
    const host = mount(() => <Count value={1} />);

    expect(one(host, "[data-slot='number-field-input']").getAttribute("style")).toBe(
      "touch-action: none;",
    );
  });
});
