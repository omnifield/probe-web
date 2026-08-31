// Живая проба (PWEB-190, по схемам — 2026-08-31): каждый компонент, объявивший `entity/io.ts`,
// получает свою тему из СТОЛЬКО ЖЕ записей, сколько строит `exampleOf` — и КАЖДАЯ реально
// проходит его собственную схему, не какую-то одну общую форму (кнопки, как было раньше).

import { compatibleItems } from "@omnifield/probe-web-io";
import { describe, expect, it } from "vitest";

import { IO } from "../../component/model/io.js";
import { PACKS } from "./registry.js";

describe("заготовки витрины — по схеме каждого компонента", () => {
  it("тема существует на каждый компонент с entity/io.ts", () => {
    const componentsWithIo = IO.list().map((entry) => entry.meta.component).sort();
    expect(PACKS.themes().sort()).toEqual(componentsWithIo);
  });

  it("каждая запись темы компонента реально проходит его собственную схему", () => {
    for (const entry of IO.list()) {
      const items = PACKS.require(entry.meta.component);
      expect(items.length).toBeGreaterThan(0);
      expect(compatibleItems(entry.schema, items)).toHaveLength(items.length);
    }
  });

  it("воспроизводимо между прогонами — сид фиксирован", () => {
    expect(PACKS.require("button")).toEqual(PACKS.require("button"));
  });
});
