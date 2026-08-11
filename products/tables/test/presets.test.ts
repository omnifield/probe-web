// Пресеты и шаблоны. Главное здесь — клон получает НОВЫЕ идентификаторы, и логика
// переписывается под них: иначе формула клона ссылалась бы в пустоту.

import { describe, expect, it } from "vitest";

import { applyFilter } from "../src/filters/evaluate.js";
import { applyPreset, applyTemplate, type Preset, type Template } from "../src/filters/presets.js";
import { referencedIds } from "../src/filters/formula.js";

const PRESET: Preset = {
  id: "case",
  label: "Опорный кейс",
  state: {
    version: 1,
    conditions: [
      { id: "seed-1", kind: "presence", quantifier: "any", mode: "exists", fields: ["/passport", "/inn"] },
      { id: "seed-2", kind: "presence", quantifier: "all", mode: "filled", fields: ["/applicant"] },
    ],
    logic: {
      mode: "formula",
      expr: { t: "and", a: { t: "ref", id: "seed-1" }, b: { t: "ref", id: "seed-2" } },
    },
  },
};

describe("применение пресета", () => {
  it("условия получают новые идентификаторы — правки не бьют по самому пресету", () => {
    const applied = applyPreset(PRESET);
    const ids = applied.conditions.map((condition) => condition.id);

    expect(ids).not.toContain("seed-1");
    expect(new Set(ids).size).toBe(2);
    expect(PRESET.state.conditions[0]!.id).toBe("seed-1");
  });

  it("формула переписывается под новые идентификаторы", () => {
    const applied = applyPreset(PRESET);
    expect(applied.logic.mode).toBe("formula");
    if (applied.logic.mode !== "formula") return;

    const ids = new Set(applied.conditions.map((condition) => condition.id));
    for (const id of referencedIds(applied.logic.expr)) expect(ids.has(id)).toBe(true);
  });

  it("клон считает то же самое, что и исходная сборка", () => {
    // Единственная проверка, которая ловит поломку целиком: ссылки могли остаться валидными
    // по форме и всё равно указывать не туда.
    const rows = [
      { applicant: "Иванов", passport: "4510" },
      { applicant: "", inn: "770" },
      { agent: "ООО" },
    ];

    const applied = applyPreset(PRESET);
    expect(applyFilter(rows, applied).rows).toEqual([{ applicant: "Иванов", passport: "4510" }]);
  });

  it("применение дважды даёт разные идентификаторы", () => {
    const first = applyPreset(PRESET).conditions.map((condition) => condition.id);
    const second = applyPreset(PRESET).conditions.map((condition) => condition.id);
    expect(first).not.toEqual(second);
  });
});

const TEMPLATE: Template = {
  id: "any-of",
  label: "Любое из полей и заявитель",
  params: [
    { key: "fields", label: "какие поля", kind: "fields" },
    { key: "name", label: "часть имени", kind: "text" },
  ],
  state: {
    version: 1,
    conditions: [
      { id: "t-1", kind: "presence", quantifier: "any", mode: "exists", fields: ["{{fields}}"] },
      { id: "t-2", kind: "compare", field: "/applicant", operator: "contains", value: "{{name}}" },
      { id: "t-3", kind: "in", field: "/region", values: ["{{fields}}", "Тула"] },
    ],
    logic: {
      mode: "formula",
      expr: { t: "and", a: { t: "ref", id: "t-1" }, b: { t: "ref", id: "t-2" } },
    },
  },
};

describe("подстановка шаблона", () => {
  it("дырка в списке полей разворачивается в выбранные поля", () => {
    const applied = applyTemplate(TEMPLATE, { fields: ["/passport", "/inn"], name: "Ив" });
    const presence = applied.conditions[0]!;

    expect(presence.kind).toBe("presence");
    if (presence.kind === "presence") expect(presence.fields).toEqual(["/passport", "/inn"]);
  });

  it("дырка в значении заполняется текстом", () => {
    const applied = applyTemplate(TEMPLATE, { fields: [], name: "Ив" });
    const compare = applied.conditions[1]!;

    expect(compare.kind).toBe("compare");
    if (compare.kind === "compare") expect(compare.value).toBe("Ив");
  });

  it("незаполненная дырка в списке просто исчезает, а соседние значения остаются", () => {
    const applied = applyTemplate(TEMPLATE, { name: "Ив" });
    const member = applied.conditions[2]!;

    expect(member.kind).toBe("in");
    if (member.kind === "in") expect(member.values).toEqual(["Тула"]);
  });

  it("логика подстановку переживает", () => {
    const applied = applyTemplate(TEMPLATE, { fields: ["/passport"], name: "Ив" });
    expect(applied.logic.mode).toBe("formula");
    if (applied.logic.mode !== "formula") return;

    const ids = new Set(applied.conditions.map((condition) => condition.id));
    for (const id of referencedIds(applied.logic.expr)) expect(ids.has(id)).toBe(true);
  });

  it("состояние после подстановки несёт версию формата", () => {
    expect(applyTemplate(TEMPLATE, { name: "Ив" }).version).toBe(1);
  });
});
