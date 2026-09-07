import { describe, expect, it } from "vitest";

import { cardVar, layoutGroup, layoutSelf, layoutVar, railVar, spaceVar } from "../src/engine/layout/index.js";

describe("layoutSelf — место одного элемента в чужом потоке", () => {
  it("maps grow/shrink to flex-grow/flex-shrink", () => {
    expect(layoutSelf({ grow: true, shrink: false })).toEqual({ "flex-grow": "1", "flex-shrink": "0" });
  });

  it("maps align/justify to align-self/justify-self, not the *-items/*-content pair", () => {
    expect(layoutSelf({ align: "center", justify: "stretch" })).toEqual({
      "align-self": "center",
      "justify-self": "stretch",
    });
  });

  it("maps order as-is and basis through the space scale", () => {
    expect(layoutSelf({ order: 2, basis: "space-4" })).toEqual({ order: "2", "flex-basis": "var(--space-4)" });
  });

  it("passes basis \"auto\" through untouched", () => {
    expect(layoutSelf({ basis: "auto" })).toEqual({ "flex-basis": "auto" });
  });

  it("omits keys for props left undefined", () => {
    expect(layoutSelf({})).toEqual({});
  });
});

describe("layoutGroup — своими детьми управляет родитель", () => {
  it("maps align/justify to align-items/justify-content, not the *-self pair", () => {
    expect(layoutGroup({ align: "center", justify: "space-between" })).toEqual({
      "align-items": "center",
      "justify-content": "space-between",
    });
  });

  it("maps gap through the space scale and direction/wrap as-is", () => {
    expect(layoutGroup({ gap: "space-2", direction: "column", wrap: true })).toEqual({
      gap: "var(--space-2)",
      "flex-direction": "column",
      "flex-wrap": "wrap",
    });
  });

  it("maps wrap: false to nowrap", () => {
    expect(layoutGroup({ wrap: false })).toEqual({ "flex-wrap": "nowrap" });
  });
});

describe("spaceVar — не рассинхронится молча со шкалой space", () => {
  it("resolves a known step to its custom property", () => {
    expect(spaceVar("space-8")).toBe("var(--space-8)");
  });

  it("throws loudly for a step the scale does not declare", () => {
    // @ts-expect-error — рантайм-проверка нужна ровно на случай, когда литеральный тип и шкала разошлись
    expect(() => spaceVar("space-999")).toThrow(/space-999/);
  });
});

describe("railVar/cardVar/layoutVar — та же сверка со своей шкалой", () => {
  it("resolves each scale's known steps to its custom property", () => {
    expect(railVar("rail-md")).toBe("var(--rail-md)");
    expect(cardVar("card-lg")).toBe("var(--card-lg)");
    expect(layoutVar("layout-sm")).toBe("var(--layout-sm)");
  });

  it("resolves the xl/xxl/xxxl/full steps too", () => {
    expect(railVar("rail-xl")).toBe("var(--rail-xl)");
    expect(cardVar("card-xxl")).toBe("var(--card-xxl)");
    expect(layoutVar("layout-xxxl")).toBe("var(--layout-xxxl)");
    expect(railVar("rail-full")).toBe("var(--rail-full)");
  });

  it("throws loudly for a step its own scale does not declare", () => {
    // @ts-expect-error — рантайм-проверка нужна ровно на случай, когда литеральный тип и шкала разошлись
    expect(() => railVar("rail-999")).toThrow(/rail-999/);
    // @ts-expect-error — то же для card
    expect(() => cardVar("card-999")).toThrow(/card-999/);
    // @ts-expect-error — то же для layout
    expect(() => layoutVar("layout-999")).toThrow(/layout-999/);
  });

  it("does not cross-accept another scale's step name", () => {
    // @ts-expect-error — "space-4" не ступень шкалы "rail"
    expect(() => railVar("space-4")).toThrow(/"rail" scale/);
  });
});
