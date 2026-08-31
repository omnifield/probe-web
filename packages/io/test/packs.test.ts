// Живая проба реестра заготовок (PWEB-188): регистрация, чтение по теме, явные отказы вместо
// тихого `undefined`/тихой перезаписи — тем же приёмом, что уже доказан у `IoRegistry`.

import { describe, expect, it } from "vitest";

import { createPackRegistry } from "../src/packs.js";

describe("createPackRegistry", () => {
  it("регистрирует две разные темы и читает каждую по своему имени", () => {
    const packs = createPackRegistry();
    const sports = [{ label: "Забить гол" }, { title: "Не подходит" }];
    const tech = [{ label: "Задеплоить" }];

    packs.register("спорт", sports);
    packs.register("технологии", tech);

    expect(packs.get("спорт")).toBe(sports);
    expect(packs.get("технологии")).toBe(tech);
  });

  it("themes() перечисляет зарегистрированные имена", () => {
    const packs = createPackRegistry();
    packs.register("спорт", []);
    packs.register("технологии", []);

    expect(packs.themes()).toEqual(["спорт", "технологии"]);
  });

  it("get на незарегистрированную тему — тихий undefined, не отказ", () => {
    const packs = createPackRegistry();

    expect(packs.get("нет-такой")).toBeUndefined();
    expect(packs.has("нет-такой")).toBe(false);
  });

  it("require на незарегистрированную тему — явный отказ, не тихий undefined", () => {
    const packs = createPackRegistry();

    expect(() => packs.require("нет-такой")).toThrow(/не зарегистрирована/);
  });

  it("повторная регистрация той же темой — явный отказ, не тихая перезапись", () => {
    const packs = createPackRegistry();
    packs.register("спорт", []);

    expect(() => packs.register("спорт", [])).toThrow(/уже зарегистрирована/);
  });
});
