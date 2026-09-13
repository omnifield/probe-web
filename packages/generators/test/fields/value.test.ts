import { describe, expect, it } from "vitest";

import { valueAt, withValue } from "../../src/fields/value.js";

describe("valueAt", () => {
  it("читает значение по составному пути", () => {
    expect(valueAt({ recipe: { variant: "solid" } }, ["recipe", "variant"])).toBe("solid");
  });

  it("читает список как есть, не разворачивая элементы", () => {
    const data = { items: [{ value: "a", label: "A" }] };
    expect(valueAt(data, ["items"])).toEqual([{ value: "a", label: "A" }]);
  });

  it("путь мимо данных — undefined", () => {
    expect(valueAt({ a: 1 }, ["b", "c"])).toBeUndefined();
  });
});

describe("withValue", () => {
  it("заменяет ключ верхнего уровня целиком, не мутируя исходный объект", () => {
    const before = { items: [{ value: "a", label: "A" }] };
    const after = withValue(before, ["items"], [{ value: "b", label: "B" }]);

    expect(after).toEqual({ items: [{ value: "b", label: "B" }] });
    expect(before.items[0]!.value).toBe("a");
  });

  it("пишет по вложенному пути, не задевая соседние ключи узла", () => {
    const before = { recipe: { variant: "solid", size: 1 } };
    const after = withValue(before, ["recipe", "variant"], "outline");

    expect(after).toEqual({ recipe: { variant: "outline", size: 1 } });
  });

  it("достраивает недостающий вложенный узел", () => {
    expect(withValue({}, ["recipe", "variant"], "outline")).toEqual({ recipe: { variant: "outline" } });
  });
});
