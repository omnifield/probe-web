// Конструктор адаптера в документе. Проверяется то, без чего он превращается в гадание:
// пути источника предложены списком, отчёт виден, «до и после» показано на живых данных.

import { afterEach, describe, expect, it } from "vitest";
import { createSignal } from "solid-js";

import { AdapterBuilder } from "../src/adapter/ui/adapter-builder.jsx";
import type { AdapterSpec } from "../src/adapter/model.js";
import type { ColumnDictionary } from "../src/table/index.js";
import { all, cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const FIELDS: ColumnDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/status", label: "статус", type: "text" },
];

const SAMPLE = {
  data: {
    items: [
      { client: { last: "Иванов" }, amount_cents: "125000", legacy_id: "A-1" },
      { client: { last: "Петров" }, amount_cents: "нет", legacy_id: "A-2" },
    ],
  },
};

const SPEC: AdapterSpec = {
  version: 1,
  rows: "/data/items",
  fields: [
    { target: "/applicant", from: "/client/last" },
    { target: "/amount", from: "/amount_cents", steps: [{ kind: "number" }, { kind: "divide", by: 100 }] },
  ],
};

function setup(initial: AdapterSpec = SPEC) {
  const [spec, setSpec] = createSignal(initial);
  const host = mount(() => (
    <AdapterBuilder fields={FIELDS} sample={SAMPLE} spec={spec()} onChange={setSpec} />
  ));
  return { host, spec };
}

describe("разведка источника", () => {
  it("места, похожие на набор строк, предложены списком", () => {
    const { host } = setup();
    const options = all<HTMLOptionElement>(host, "[data-slot~='adapter-rows'] option").map((o) => o.value);
    expect(options).toContain("/data/items");
  });

  it("пути внутри строки предложены списком — их не набирают руками", () => {
    const { host } = setup();
    const first = all(host, "[data-slot~='adapter-rule-from']")[0]!;
    const options = all<HTMLOptionElement>(first, "option").map((option) => option.value);
    expect(options).toContain("/client/last");
    expect(options).toContain("/amount_cents");
  });
});

describe("правила", () => {
  it("рисует по строке на правило и нумерует их", () => {
    const { host } = setup();
    expect(all(host, "[data-slot~='adapter-rule']")).toHaveLength(2);
    expect(one(host, "[data-slot~='adapter-rule-number']").textContent).toBe("1");
  });

  it("добавляет правило на свободное поле словаря", () => {
    const { host, spec } = setup();
    press(one(host, "[data-slot~='adapter-add']"));
    expect(spec().fields).toHaveLength(3);
    expect(spec().fields[2]!.target).toBe("/status");
  });

  it("убирает правило", () => {
    const { host, spec } = setup();
    press(all(host, "[data-slot~='adapter-rule-remove']")[0]!);
    expect(spec().fields.map((rule) => rule.target)).toEqual(["/amount"]);
  });

  it("действия видны цепочкой и снимаются по одному", () => {
    const { host, spec } = setup();
    const steps = all(host, "[data-slot~='adapter-rule'][data-target='/amount'] [data-slot~='adapter-rule-step']");
    expect(steps).toHaveLength(2);

    press(one(steps[1]!, "[data-slot~='adapter-rule-step-remove']"));
    expect(spec().fields[1]!.steps).toHaveLength(1);
  });
});

describe("отчёт и предпросмотр", () => {
  it("говорит, сколько прочитано и сколько доехало", () => {
    const { host } = setup();
    expect(one(host, "[data-slot~='adapter-count']").textContent).toContain("прочитано 2, доехало 2");
  });

  it("у правила видно, что и почему не легло, с примером", () => {
    // Тот же приём, что и счётчик у условия фильтра: ошибку настройки видно сразу.
    const { host } = setup();
    const issue = one(host, "[data-slot~='adapter-rule'][data-target='/amount'] [data-slot~='adapter-rule-issue']");

    expect(issue.textContent).toContain("не легло 1");
    expect(issue.textContent).toContain("не число");
    expect(issue.textContent).toContain("нет");
  });

  it("называет их поля, для которых правил нет", () => {
    const { host } = setup();
    expect(one(host, "[data-slot~='adapter-unmapped']").textContent).toContain("/legacy_id");
  });

  it("показывает «до» и «после» на живых данных", () => {
    const { host } = setup();
    expect(one(host, "[data-slot~='adapter-before']").textContent).toContain("amount_cents");
    expect(one(host, "[data-slot~='adapter-after']").textContent).toContain("applicant");
  });

  it("не туда посмотрели — это ошибка целиком, а не пустой отчёт", () => {
    const { host } = setup({ ...SPEC, rows: "/data/rows" });
    expect(one(host, "[data-slot~='adapter-error']").textContent).toContain("набора строк нет");
  });
});
