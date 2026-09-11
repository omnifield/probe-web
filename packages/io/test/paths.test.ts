import { describe, expect, it } from "vitest";
import { z } from "zod";

import { describeSample, describeSchema, discoverPaths, lookup, pointerOf } from "../src/index.js";
import { assign } from "../src/engine/paths.js";

describe("lookup", () => {
  it("находит вложенное значение по JSON Pointer", () => {
    expect(lookup({ a: { b: [10, 20] } }, "/a/b/1")).toEqual({ found: true, value: 20 });
  });

  it("пустой путь — сами данные целиком", () => {
    const data = { a: 1 };
    expect(lookup(data, "")).toEqual({ found: true, value: data });
  });

  it("путь мимо — found: false, не бросок", () => {
    expect(lookup({ a: 1 }, "/b")).toEqual({ found: false, value: undefined });
    expect(lookup({ a: [1] }, "/a/9")).toEqual({ found: false, value: undefined });
    expect(lookup({ a: 1 }, "/a/b")).toEqual({ found: false, value: undefined });
  });

  it("экранирование ~0/~1 читается обратно", () => {
    expect(lookup({ "a/b": { "c~d": 5 } }, pointerOf(["a/b", "c~d"]))).toEqual({ found: true, value: 5 });
  });
});

describe("assign", () => {
  it("достраивает вложенность — мутирует и возвращает ТОТ ЖЕ аккумулятор (свой, не чужие данные)", () => {
    const row = { a: { x: 1 } };
    const result = assign(row, "/a/y", 2);

    expect(result).toBe(row);
    expect(row).toEqual({ a: { x: 1, y: 2 } });
  });
});

describe("discoverPaths", () => {
  it("перечисляет пути образца, включая один элемент массива", () => {
    const paths = discoverPaths({ id: "1", items: [{ title: "x" }] });

    expect(paths).toContain("/id");
    expect(paths).toContain("/items");
    expect(paths).toContain("/items/0/title");
  });
});

describe("describeSample", () => {
  it("отдаёт только скалярные листья — без узлов-контейнеров", () => {
    const paths = describeSample({ id: "1", items: [{ title: "x", views: 5 }] });

    expect(paths).toEqual([
      { path: "/id", type: "string" },
      { path: "/items/0/title", type: "string" },
      { path: "/items/0/views", type: "number" },
    ]);
  });

  it("null/undefined → type: null", () => {
    expect(describeSample(null)).toEqual([{ path: "", type: "null" }]);
    expect(describeSample(undefined)).toEqual([{ path: "", type: "null" }]);
    expect(describeSample({ a: null, b: undefined })).toEqual([
      { path: "/a", type: "null" },
      { path: "/b", type: "null" },
    ]);
  });

  it("пустой массив — один leaf unknown на пути самого массива, без /0", () => {
    expect(describeSample({ items: [] })).toEqual([{ path: "/items", type: "unknown" }]);
  });

  it("непустой массив — тип берётся у первого элемента, путь с индексом /0", () => {
    expect(describeSample({ items: [1, 2, 3] })).toEqual([{ path: "/items/0", type: "number" }]);
  });

  it("примитив в корне — path: ''", () => {
    expect(describeSample("x")).toEqual([{ path: "", type: "string" }]);
    expect(describeSample(true)).toEqual([{ path: "", type: "boolean" }]);
  });

  it("depth ограничивает глубину обхода", () => {
    const deep = { a: { b: { c: { d: "x" } } } };
    expect(describeSample(deep, 2)).toEqual([]);
    expect(describeSample(deep, 4)).toEqual([{ path: "/a/b/c/d", type: "string" }]);
  });
});

describe("describeSchema", () => {
  it("отдаёт только скалярные листья схемы", () => {
    const schema = z.object({
      id: z.string(),
      items: z.array(z.object({ title: z.string(), views: z.number() })),
    });

    expect(describeSchema(schema)).toEqual([
      { path: "/id", type: "string" },
      { path: "/items/0/title", type: "string" },
      { path: "/items/0/views", type: "number" },
    ]);
  });

  it("enum отдельным типом", () => {
    const schema = z.object({ status: z.enum(["ok", "fail"]) });
    expect(describeSchema(schema)).toEqual([{ path: "/status", type: "enum" }]);
  });

  it("$ref-цикл → recursive, не бесконечный обход", () => {
    interface Node {
      readonly name: string;
      readonly children: readonly Node[];
    }
    const nodeSchema: z.ZodType<Node> = z.lazy(() =>
      z.object({ name: z.string(), children: z.array(nodeSchema) }),
    );
    // вложенность нужна, чтобы `z.toJSONSchema` вынес тип в `$defs` с `$ref: "#/$defs/..."` —
    // цикл в корне ссылается на "#" напрямую, без `$defs`, это другой (нетестируемый здесь) путь.
    const schema = z.object({ tree: nodeSchema });

    const paths = describeSchema(schema);
    expect(paths).toContainEqual({ path: "/tree/name", type: "string" });
    expect(paths.some((p) => p.type === "recursive")).toBe(true);
  });

  it("схема не сериализуется — пустой список, не throw", () => {
    const broken = { safeParse: () => ({}) } as unknown as z.ZodType;
    expect(describeSchema(broken)).toEqual([]);
  });

  it("пустой tuple в схеме — items отсутствует в JSON Schema, leaf unknown без индекса", () => {
    const schema = z.object({ tags: z.tuple([]) });
    expect(describeSchema(schema)).toEqual([{ path: "/tags", type: "unknown" }]);
  });
});
