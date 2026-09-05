// Живая проба реестра: регистрация, чтение по имени, явные отказы вместо тихого
// `undefined`/тихой перезаписи — предмет самого решения, не довесок.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createIoRegistry } from "../src/index.js";

describe("createIoRegistry", () => {
  it("регистрирует два разных паспорта и читает каждый по своему имени", () => {
    const registry = createIoRegistry();
    const buttonSchema = z.object({ label: z.string() });
    const accordionSchema = z.object({ sections: z.array(z.object({ id: z.string() })) });

    registry.register("button", buttonSchema, "input");
    registry.register("accordion", accordionSchema, "input");

    expect(registry.get("button")?.schema).toBe(buttonSchema);
    expect(registry.get("button")?.meta).toEqual({ component: "button", direction: "input" });
    expect(registry.get("accordion")?.schema).toBe(accordionSchema);
  });

  it("возвращает ту же схему, что приняла — можно регистрировать прямо в месте объявления", () => {
    const registry = createIoRegistry();
    const schema = registry.register("button", z.object({ label: z.string() }));

    expect(registry.get("button")?.schema).toBe(schema);
  });

  it('направление по умолчанию — "io"', () => {
    const registry = createIoRegistry();
    registry.register("button", z.object({ label: z.string() }));

    expect(registry.get("button")?.meta.direction).toBe("io");
  });

  it("get на незарегистрированное имя — тихий undefined, не отказ", () => {
    const registry = createIoRegistry();

    expect(registry.get("нет-такого")).toBeUndefined();
    expect(registry.has("нет-такого")).toBe(false);
  });

  it("require на незарегистрированное имя — явный отказ, не тихий undefined", () => {
    const registry = createIoRegistry();

    expect(() => registry.require("нет-такого")).toThrow(/не зарегистрирован/);
  });

  it("повторная регистрация тем же именем — явный отказ, не тихая перезапись", () => {
    const registry = createIoRegistry();
    registry.register("button", z.object({ label: z.string() }));

    expect(() => registry.register("button", z.object({ label: z.string() }))).toThrow(
      /уже зарегистрирован/,
    );
  });
});
