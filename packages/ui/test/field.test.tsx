import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Field, FieldDescription, FieldError, Input, Label, Textarea } from "../src/field.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("Field — корень", () => {
  it("рендерит ОДИН узел `<div>`", () => {
    const host = mount(() => <Field />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("DIV");
  });

  it("каждая часть — ровно один узел, обёрток между ними нет", () => {
    const host = mount(() => (
      <Field>
        <Label>Почта</Label>
        <Input type="email" />
        <FieldDescription>Куда придёт письмо</FieldDescription>
      </Field>
    ));
    const root = one(host, "div[data-slot='field']");

    // Три части — три прямых потомка корня. Появится обёртка — счёт разойдётся.
    expect(root.children.length).toBe(3);
    expect([...root.children].map((node) => node.tagName)).toEqual(["LABEL", "INPUT", "DIV"]);
  });
});

describe("Field — связка частей", () => {
  it("подпись связана с вводом: `for` подписи равен `id` ввода", () => {
    const host = mount(() => (
      <Field>
        <Label>Почта</Label>
        <Input />
      </Field>
    ));

    const label = one<HTMLLabelElement>(host, "label");
    const input = one<HTMLInputElement>(host, "input");

    // Это и есть смысл корня: идентификаторы он раздаёт сам, потребитель их не пишет.
    expect(input.id).not.toBe("");
    expect(label.getAttribute("for")).toBe(input.id);
  });

  it("пояснение попадает в `aria-describedby` ввода", () => {
    const host = mount(() => (
      <Field>
        <Input />
        <FieldDescription>Куда придёт письмо</FieldDescription>
      </Field>
    ));

    const input = one<HTMLInputElement>(host, "input");
    const description = one(host, "[data-slot='field-description']");

    expect(input.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("состояние корня раздаётся частям: `disabled`, `required`, `name`", () => {
    const host = mount(() => (
      <Field disabled required name="mail">
        <Input />
      </Field>
    ));
    const input = one<HTMLInputElement>(host, "input");

    expect(input.disabled).toBe(true);
    expect(input.required).toBe(true);
    expect(input.name).toBe("mail");
  });

  it("значением владеет корень — управляемый режим работает через него", () => {
    const [value, setValue] = createSignal("до");
    const onChange = vi.fn(setValue);

    const host = mount(() => (
      <Field value={value()} onChange={onChange}>
        <Input />
      </Field>
    ));
    const input = one<HTMLInputElement>(host, "input");

    expect(input.value).toBe("до");

    setValue("после");
    expect(input.value).toBe("после");
  });

  it("правка ввода доходит до `onChange` корня", () => {
    const onChange = vi.fn();
    const host = mount(() => (
      <Field onChange={onChange}>
        <Input />
      </Field>
    ));
    const input = one<HTMLInputElement>(host, "input");

    input.value = "набрано";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onChange).toHaveBeenCalledWith("набрано");
  });
});

describe("Field — состояние ошибки", () => {
  it("при `validationState=invalid` ввод помечен `aria-invalid`", () => {
    const host = mount(() => (
      <Field validationState="invalid">
        <Input />
      </Field>
    ));

    expect(one(host, "input").getAttribute("aria-invalid")).toBe("true");
  });

  it("сообщение об ошибке рендерится ТОЛЬКО при `invalid`", () => {
    const [state, setState] = createSignal<"valid" | "invalid">("valid");
    const host = mount(() => (
      <Field validationState={state()}>
        <Input />
        <FieldError>Не похоже на адрес</FieldError>
      </Field>
    ));

    expect(host.querySelector("[data-slot='field-error']")).toBeNull();

    setState("invalid");

    const error = one(host, "[data-slot='field-error']");
    expect(error.textContent).toBe("Не похоже на адрес");
    // Сообщение связано с вводом, иначе скринридер прочитает поле без причины отказа.
    expect(one(host, "input").getAttribute("aria-describedby")).toContain(error.id);
  });
});

describe("Textarea", () => {
  it("рендерит ОДИН узел `<textarea>`, связанный с корнем", () => {
    const host = mount(() => (
      <Field defaultValue="черновик">
        <Label>Описание</Label>
        <Textarea />
      </Field>
    ));

    const area = one<HTMLTextAreaElement>(host, "textarea");
    const label = one<HTMLLabelElement>(host, "label");

    expect(area.value).toBe("черновик");
    expect(label.getAttribute("for")).toBe(area.id);
  });
});

describe("части вне корня", () => {
  it("падают внятной ошибкой, а не молча теряют связку", () => {
    // Названная цена решения (см. шапку `src/field.tsx`). Тест держит её ЯВНОЙ: если
    // однажды поведение поменяется, это будет решение, а не находка потребителя.
    expect(() => mount(() => <Input />)).toThrowError(/FormControlContext/);
  });
});
