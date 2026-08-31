// Живая проба (PWEB-190): в каждой заявленной теме известное число записей реально проходит
// вход кнопки — ровно те, что задуманы совместимыми, ни больше, ни меньше.

import { compatibleItems } from "@omnifield/probe-web-io";
import { ioOf } from "@omnifield/probe-web-ui/io";
import { describe, expect, it } from "vitest";

import { PACKS } from "./registry.js";

const buttonInput = ioOf("button")!.input!;

describe("заготовки витрины — подбор под вход кнопки", () => {
  it("технологии: 5 совместимых из 7 записей", () => {
    expect(compatibleItems(buttonInput, PACKS.require("технологии"))).toHaveLength(5);
  });

  it("коммерция: 5 совместимых из 6 записей", () => {
    expect(compatibleItems(buttonInput, PACKS.require("коммерция"))).toHaveLength(5);
  });

  it("музыка: 5 совместимых из 6 записей", () => {
    expect(compatibleItems(buttonInput, PACKS.require("музыка"))).toHaveLength(5);
  });

  it("themes() называет все три темы", () => {
    expect(PACKS.themes().sort()).toEqual(["коммерция", "музыка", "технологии"]);
  });
});
