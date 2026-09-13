import { z } from "@web-core/io";
import { describe, expect, it } from "vitest";

import { blankElement, fieldsOf, fieldsOfElement } from "../../src/fields/walker.js";

// Тот же канон, что `packages/ui/src/shared/data/fields.ts` — рекурсивный `item` через `z.lazy`,
// `children` — массив ТАКИХ ЖЕ элементов.
interface Item {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly Item[];
}
const item: z.ZodType<Item> = z.lazy(() =>
  z.object({ value: z.string(), label: z.string(), children: z.array(item).optional() }),
);
const treeSchema = z.object({ items: z.array(item) });

describe("fieldsOf — скаляры и enum верхнего уровня", () => {
  it("отдаёт path/label/kind для string/number/boolean", () => {
    const fields = fieldsOf(z.object({ name: z.string(), age: z.number(), active: z.boolean() }));

    expect(fields).toContainEqual({ path: ["name"], label: "name", kind: "string", options: undefined });
    expect(fields).toContainEqual({ path: ["age"], label: "age", kind: "number", options: undefined });
    expect(fields).toContainEqual({ path: ["active"], label: "active", kind: "boolean", options: undefined });
  });

  it("enum строк несёт свои options", () => {
    const fields = fieldsOf(z.object({ variant: z.enum(["solid", "outline"]) }));
    expect(fields).toContainEqual({ path: ["variant"], label: "variant", kind: "enum", options: ["solid", "outline"] });
  });

  it("вложенный объект даёт поля с составным путём и лейблом через точку", () => {
    const fields = fieldsOf(z.object({ recipe: z.object({ variant: z.string(), size: z.number() }) }));

    expect(fields).toContainEqual({ path: ["recipe", "variant"], label: "recipe.variant", kind: "string", options: undefined });
    expect(fields).toContainEqual({ path: ["recipe", "size"], label: "recipe.size", kind: "number", options: undefined });
  });
});

describe("fieldsOf — top-level list field", () => {
  it("находит поле-массив объектов и не путает его со скаляром", () => {
    const fields = fieldsOf(treeSchema);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ path: ["items"], kind: "list" });
    expect(fields[0]!.element).toBeDefined();
  });

  it("массив примитивов не рендерится ни скаляром, ни списком", () => {
    const fields = fieldsOf(z.object({ tags: z.array(z.string()) }));
    expect(fields).toHaveLength(0);
  });

  it("непредставимая целиком схема отдаёт пустой список полей, не бросает", () => {
    expect(fieldsOf(z.custom<unknown>(() => true))).toEqual([]);
  });
});

describe("fieldsOfElement — рекурсия в children", () => {
  it("элемент несёт свои скаляры и СВОЙ список для children", () => {
    const [listField] = fieldsOf(treeSchema);
    const elementFields = fieldsOfElement(listField!.element!);

    const byPath = (path: string) => elementFields.find((f) => f.path.join("/") === path);
    expect(byPath("value")).toMatchObject({ kind: "string" });
    expect(byPath("label")).toMatchObject({ kind: "string" });

    const children = byPath("children");
    expect(children).toMatchObject({ kind: "list" });
    expect(children!.element).toBeDefined();
  });

  it("рекурсия не обрывается на втором уровне — children-элемента снова list", () => {
    const [listField] = fieldsOf(treeSchema);
    const level1 = fieldsOfElement(listField!.element!);
    const childrenField = level1.find((f) => f.path.join("/") === "children")!;
    const level2 = fieldsOfElement(childrenField.element!);

    expect(level2.find((f) => f.path.join("/") === "children")).toMatchObject({ kind: "list" });
  });
});

describe("blankElement — значения по умолчанию по типу", () => {
  it("строки — пустая строка, вложенный список — пустой массив", () => {
    const [listField] = fieldsOf(treeSchema);
    expect(blankElement(listField!.element!)).toEqual({ value: "", label: "", children: [] });
  });

  it("enum — первый вариант", () => {
    const schema = z.object({ items: z.array(z.object({ variant: z.enum(["solid", "outline"]) })) });
    const [listField] = fieldsOf(schema);
    expect(blankElement(listField!.element!)).toEqual({ variant: "solid" });
  });

  it("числа и булевы — 0 и false", () => {
    const schema = z.object({ items: z.array(z.object({ age: z.number(), active: z.boolean() })) });
    const [listField] = fieldsOf(schema);
    expect(blankElement(listField!.element!)).toEqual({ age: 0, active: false });
  });
});
