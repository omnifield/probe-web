// Живая проба подбора: тема из записей разной формы — на выходе только те, что реально проходят
// схему, в исходном порядке; тема без единой подходящей — пустой перечень, не отказ.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { compatibleItems } from "../src/index.js";

const buttonInput = z.object({ label: z.string(), payload: z.unknown().optional() });

describe("compatibleItems", () => {
  it("отбирает только записи, реально проходящие схему, в исходном порядке", () => {
    const items = [
      { label: "Забить гол" },
      { title: "Не подходит — нет label" },
      { label: "Взять реванш", payload: { id: 1 } },
    ];

    expect(compatibleItems(buttonInput, items)).toEqual([
      { label: "Забить гол" },
      { label: "Взять реванш", payload: { id: 1 } },
    ]);
  });

  it("без единой подходящей записи — пустой перечень, не отказ", () => {
    expect(compatibleItems(buttonInput, [{ title: "мимо" }])).toEqual([]);
  });

  it("пустая тема — пустой перечень", () => {
    expect(compatibleItems(buttonInput, [])).toEqual([]);
  });
});
