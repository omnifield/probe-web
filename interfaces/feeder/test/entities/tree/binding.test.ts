import { describe, expect, it } from "vitest";

import { itemBinding, type FieldBinding } from "../../../src/entities/tree/binding.js";

describe("itemBinding", () => {
  it("читает элемент списка по индексу", () => {
    const items = () => ["a", "b", "c"] as const;
    const binding: FieldBinding = { value: () => items(), onChange: () => {} };

    expect(itemBinding(binding, items, 1).value()).toBe("b");
  });

  it("запись элемента уходит через onChange списка целым новым массивом", () => {
    let list: readonly string[] = ["a", "b", "c"];
    const listBinding: FieldBinding = {
      value: () => list,
      onChange: (next) => {
        list = next as readonly string[];
      },
    };

    itemBinding(listBinding, () => list, 1).onChange("B");

    expect(list).toEqual(["a", "B", "c"]);
  });

  it("соседние элементы не задеты записью в один индекс", () => {
    let list: readonly string[] = ["a", "b", "c"];
    const listBinding: FieldBinding = {
      value: () => list,
      onChange: (next) => {
        list = next as readonly string[];
      },
    };

    itemBinding(listBinding, () => list, 0).onChange("A");

    expect(list).toEqual(["A", "b", "c"]);
  });
});
