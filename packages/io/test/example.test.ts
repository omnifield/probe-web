// Живая проба построения примера по схеме (PWEB-187 продолжение): результат ОБЯЗАН пройти
// `schema.safeParse` для схем разной формы — объект, массив, вложенный объект, необязательное
// поле, перечисление — не подбирается на глаз, а строится обходом самой схемы.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { exampleOf, type ExampleLeafGenerator } from "../src/example.js";

const genericLeaf: ExampleLeafGenerator = (node) => {
  if (node.enum) return node.enum[0];
  if (node.type === "string") return "x";
  if (node.type === "number" || node.type === "integer") return 1;
  if (node.type === "boolean") return true;
  return null;
};

describe("exampleOf", () => {
  it("строит объект, реально проходящий свою схему", () => {
    const schema = z.object({ label: z.string(), count: z.number() });
    const example = exampleOf(schema, genericLeaf);

    expect(schema.safeParse(example).success).toBe(true);
  });

  it("заполняет и необязательные поля — витрина показывает полную форму", () => {
    const schema = z.object({ label: z.string(), placeholder: z.string().optional() });
    const example = exampleOf(schema, genericLeaf);

    expect(example).toHaveProperty("placeholder");
    expect(schema.safeParse(example).success).toBe(true);
  });

  it("строит массив фиксированной длины из вложенной схемы", () => {
    const schema = z.object({ items: z.array(z.object({ value: z.string(), label: z.string() })) });
    const example = exampleOf(schema, genericLeaf);

    expect(Array.isArray(example.items)).toBe(true);
    expect(example.items.length).toBeGreaterThan(0);
    expect(schema.safeParse(example).success).toBe(true);
  });

  it("вложенные объекты внутри массивов — та же форма, что и у аккордеона", () => {
    const item = z.object({ value: z.string(), label: z.string() });
    const section = z.object({ id: z.string(), title: z.string(), items: z.array(item).optional() });
    const schema = z.object({ sections: z.array(section) });

    const example = exampleOf(schema, genericLeaf);

    expect(schema.safeParse(example).success).toBe(true);
  });

  it("перечисление — генератору листа приходит `enum`, значение берётся из него", () => {
    const schema = z.object({ kind: z.enum(["a", "b", "c"]) });
    const example = exampleOf(schema, genericLeaf);

    expect(["a", "b", "c"]).toContain(example.kind);
    expect(schema.safeParse(example).success).toBe(true);
  });

  it("путь до листа несёт имена полей сверху вниз — по нему решает вызывающий", () => {
    const schema = z.object({ sections: z.array(z.object({ title: z.string() })) });
    const paths: string[][] = [];

    exampleOf(schema, (node, path) => {
      paths.push([...path]);
      return genericLeaf(node, path);
    });

    expect(paths).toContainEqual(["sections", "0", "title"]);
  });
});
