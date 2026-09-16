import { describe, expect, it } from "vitest";
import { skeletonOf } from "#/entities/schema";

describe("skeletonOf — ключи и типы, без значений", () => {
  it("примитивы", () => {
    expect(skeletonOf("текст")).toEqual({ type: "string" });
    expect(skeletonOf(42)).toEqual({ type: "number" });
    expect(skeletonOf(true)).toEqual({ type: "boolean" });
    expect(skeletonOf(null)).toEqual({ type: "null" });
    expect(skeletonOf(undefined)).toEqual({ type: "null" });
  });

  it("объект — ключи и тип каждого значения, само значение выброшено", () => {
    expect(
      skeletonOf({
        userId: 1,
        id: 1,
        title: "delectus aut autem",
        completed: false,
      }),
    ).toEqual({
      type: "object",
      properties: {
        userId: { type: "number" },
        id: { type: "number" },
        title: { type: "string" },
        completed: { type: "boolean" },
      },
    });
  });

  it("массив — тип первого элемента, пустой массив без items", () => {
    expect(skeletonOf([{ a: 1 }, { a: 2 }])).toEqual({
      type: "array",
      items: { type: "object", properties: { a: { type: "number" } } },
    });
    expect(skeletonOf([])).toEqual({ type: "array", items: undefined });
  });

  it("вложенность рекурсивна", () => {
    expect(skeletonOf({ user: { name: "Ева", tags: ["a", "b"] } })).toEqual({
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            name: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
      },
    });
  });
});
