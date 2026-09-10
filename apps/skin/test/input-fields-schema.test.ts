// Чистая логика `widgets/component/input/schema.ts` — без DOM и без сети, дешевле и надёжнее
// браузерного клика (в MCP-браузере этой сессии нет ввода текста, только click/screenshot).
import { z } from "@web-core/io";
import { describe, expect, it } from "vitest";

import { blankElement, fieldsOf, fieldsOfElement, valueAt, withValue } from "#/widgets/component/input/schema";

// Тот же канон, что `packages/ui/src/shared/data/fields.ts` (`unified-item-collection-engine`) —
// рекурсивный `item` через `z.lazy`, `children` — массив ТАКИХ ЖЕ элементов.
interface Item {
  readonly value: string;
  readonly label: string;
  readonly children?: readonly Item[];
}
const item: z.ZodType<Item> = z.lazy(() =>
  z.object({ value: z.string(), label: z.string(), children: z.array(item).optional() }),
);
const treeSchema = z.object({ items: z.array(item) });

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
});

describe("valueAt/withValue — не задевают форму массива", () => {
  it("withValue заменяет ключ верхнего уровня целиком, не трогая остальные", () => {
    const before = { items: [{ value: "a", label: "A" }] };
    const after = withValue(before, ["items"], [{ value: "b", label: "B" }]);
    expect(after).toEqual({ items: [{ value: "b", label: "B" }] });
    expect(before.items[0]!.value).toBe("a"); // исходный объект не мутирован
  });

  it("valueAt читает список как есть, не разворачивая элементы", () => {
    const data = { items: [{ value: "a", label: "A" }] };
    expect(valueAt(data, ["items"])).toEqual([{ value: "a", label: "A" }]);
  });
});
