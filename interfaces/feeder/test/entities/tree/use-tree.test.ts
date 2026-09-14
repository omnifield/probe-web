import { fieldsOf, type FieldDescriptor } from "@web-core/generators/fields";
import { z } from "@web-core/io";
import { createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import type { FieldBinding } from "../../../src/entities/tree/binding.js";
import { useTree } from "../../../src/entities/tree/use-tree.js";

const schema = z.object({
  tags: z.array(z.object({ value: z.string(), label: z.string() })),
});

function listField(): FieldDescriptor {
  const field = fieldsOf(schema).find((candidate) => candidate.kind === "list");
  if (!field) throw new Error("ожидалось поле-список в тестовой схеме");
  return field;
}

function signalBinding(initial: unknown): FieldBinding & { value: () => unknown } {
  const [value, setValue] = createSignal<unknown>(initial);
  return { value, onChange: setValue };
}

describe("useTree", () => {
  it("elementFields — поля одного элемента списка, из field.element", () => {
    createRoot((dispose) => {
      const { elementFields } = useTree(listField(), signalBinding([]));

      expect(elementFields().map((field) => field.path)).toEqual(
        expect.arrayContaining([["value"], ["label"]]),
      );
      dispose();
    });
  });

  it("items/indices читают текущий массив из binding.value()", () => {
    createRoot((dispose) => {
      const binding = signalBinding([{ value: "a", label: "A" }, { value: "b", label: "B" }]);
      const { items, indices } = useTree(listField(), binding);

      expect(items()).toHaveLength(2);
      expect(indices()).toEqual([0, 1]);
      dispose();
    });
  });

  it("items — не массив в value() читается как пустой список, не падает", () => {
    createRoot((dispose) => {
      const { items, indices } = useTree(listField(), signalBinding(undefined));

      expect(items()).toEqual([]);
      expect(indices()).toEqual([]);
      dispose();
    });
  });

  it("add — дописывает пустой элемент в конец через onChange", () => {
    createRoot((dispose) => {
      const binding = signalBinding([{ value: "a", label: "A" }]);
      const { add } = useTree(listField(), binding);

      add();

      expect(binding.value()).toEqual([
        { value: "a", label: "A" },
        { value: "", label: "" },
      ]);
      dispose();
    });
  });

  it("removeAt — убирает элемент по индексу, остальные сохраняют порядок", () => {
    createRoot((dispose) => {
      const binding = signalBinding([
        { value: "a", label: "A" },
        { value: "b", label: "B" },
        { value: "c", label: "C" },
      ]);
      const { removeAt } = useTree(listField(), binding);

      removeAt(1);

      expect(binding.value()).toEqual([
        { value: "a", label: "A" },
        { value: "c", label: "C" },
      ]);
      dispose();
    });
  });
});
