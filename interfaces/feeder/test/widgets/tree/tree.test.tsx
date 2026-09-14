import { fieldsOf } from "@web-core/generators/fields";
import { z } from "@web-core/io";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Tree } from "../../../src/widgets/tree/root.js";

const schema = z.object({
  name: z.string(),
  tags: z.array(z.object({ value: z.string(), label: z.string() })),
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mountTree(initial: unknown = {}) {
  const [value, setValue] = createSignal<unknown>(initial);
  const changes: unknown[] = [];
  const onChange = (next: unknown) => {
    changes.push(next);
    setValue(next);
  };

  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <Tree schema={schema} value={value()} onChange={onChange} />, host);

  return { host, changes };
}

describe("Tree — мод 1, скалярное поле", () => {
  it("рендерит текстовый инпут для строкового поля и пишет через onChange по пути", () => {
    const { host, changes } = mountTree();

    const input = host.querySelector<HTMLInputElement>('input[data-scope="field"][data-part="input"]');
    expect(input).not.toBeNull();

    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, "hello");
    input!.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changes.at(-1)).toEqual({ name: "hello" });
  });
});

describe("Tree — мод 1, список", () => {
  it("«Добавить» дописывает пустой элемент через onChange, схема list-поля из fieldsOf", () => {
    expect(fieldsOf(schema).some((field) => field.kind === "list")).toBe(true);

    const { host, changes } = mountTree({ tags: [] });

    const addButton = host.querySelector<HTMLButtonElement>('button[aria-label="Добавить"]');
    expect(addButton).not.toBeNull();
    addButton!.click();

    expect(changes.at(-1)).toEqual({ tags: [{ value: "", label: "" }] });
  });

  it("каждый элемент списка несёт свою кнопку «Убрать», клик убирает ровно его", () => {
    const { host, changes } = mountTree({
      tags: [
        { value: "a", label: "A" },
        { value: "b", label: "B" },
      ],
    });

    const removeButtons = host.querySelectorAll<HTMLButtonElement>('button[aria-label="Убрать"]');
    expect(removeButtons).toHaveLength(2);

    removeButtons[0]!.click();

    expect(changes.at(-1)).toEqual({ tags: [{ value: "b", label: "B" }] });
  });
});
