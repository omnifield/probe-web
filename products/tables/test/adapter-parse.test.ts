// Чтение файла адаптера с границы. Файл подменяемый — значит проверяется целиком и с адресом.

import { describe, expect, it } from "vitest";

import type { AdapterSpec } from "../src/adapter/model.js";
import { parseAdapter, serializeAdapter } from "../src/adapter/parse.js";

const GOOD: AdapterSpec = {
  version: 1,
  label: "Старый бэк заявок",
  rows: "/data/items",
  fields: [
    {
      target: "/applicant",
      from: "/client/last",
      steps: [{ kind: "concat", parts: [{ from: "/client/first" }, { text: "—" }], separator: " " }],
    },
    {
      target: "/amount",
      from: "/amount_cents",
      steps: [{ kind: "number" }, { kind: "divide", by: 100 }, { kind: "round", digits: 2 }],
      onFail: "default",
      fallback: "0",
    },
    {
      target: "/status",
      from: "/status_code",
      steps: [{ kind: "dictionary", values: { "1": "новая" }, otherwise: "fail" }],
      onFail: "reject",
    },
    { target: "/contact/phone", steps: [{ kind: "coalesce", from: ["/mobile", "/work_phone"] }] },
    { target: "/source", steps: [{ kind: "constant", value: "старый бэк" }] },
  ],
  extra: "drop",
};

const parse = (input: unknown) => parseAdapter(JSON.parse(JSON.stringify(input)));

describe("круг чтения и записи", () => {
  it("файл переживает выдачу и разбор без потерь", () => {
    const parsed = parse(serializeAdapter(GOOD));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.spec).toEqual(GOOD);
  });

  it("выдача — копия, а не ссылка на живое состояние", () => {
    const copy = serializeAdapter(GOOD);
    copy.fields.length = 0;
    expect(GOOD.fields).toHaveLength(5);
  });
});

describe("версия формата", () => {
  it("без версии не читаем", () => {
    const parsed = parse({ rows: "", fields: [] });
    expect(parsed).toEqual({
      ok: false,
      error: "у адаптера нет версии формата — прочитать его нечем",
    });
  });

  it("чужая версия названа числом", () => {
    const parsed = parse({ ...GOOD, version: 4 });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe("версия формата 4 не поддерживается, нужна 1");
  });
});

describe("испорченный файл не проходит границу", () => {
  it.each([
    ["не объект", 42, "адаптер должен быть объектом"],
    [
      "путь к набору не путь",
      { version: 1, rows: "data.items", fields: [] },
      "путь к набору строк «data.items» — не путь вида «/имя»",
    ],
    [
      "цель правила не путь",
      { version: 1, rows: "", fields: [{ target: "applicant", from: "/a" }] },
      "правило №1: цель «applicant» — не путь вида «/имя»",
    ],
    [
      "неизвестное действие",
      { version: 1, rows: "", fields: [{ target: "/a", from: "/b", steps: [{ kind: "магия" }] }] },
      "правило №1, шаг 1: неизвестное действие «магия»",
    ],
    [
      "у разреза нет разделителя",
      { version: 1, rows: "", fields: [{ target: "/a", from: "/b", steps: [{ kind: "split", take: 0 }] }] },
      "правило №1, шаг 1: у разреза нужен разделитель",
    ],
    [
      "множитель не число",
      {
        version: 1,
        rows: "",
        fields: [{ target: "/a", from: "/b", steps: [{ kind: "divide", by: "сто" }] }],
      },
      "правило №1, шаг 1: множитель должен быть числом",
    ],
    [
      "неизвестный вид даты",
      {
        version: 1,
        rows: "",
        fields: [{ target: "/a", from: "/b", steps: [{ kind: "date", from: "римская" }] }],
      },
      "правило №1, шаг 1: неизвестный вид даты «римская»",
    ],
    [
      "правилу нечего брать",
      { version: 1, rows: "", fields: [{ target: "/a" }] },
      "правило №1: нечего брать — нет ни источника, ни действий",
    ],
    [
      "неизвестное поведение при неудаче",
      { version: 1, rows: "", fields: [{ target: "/a", from: "/b", onFail: "паника" }] },
      "правило №1: неизвестное поведение при неудаче «паника»",
    ],
  ])("%s", (_name, input, error) => {
    const parsed = parse(input);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe(error);
  });

  it("«подставить умолчание» без самого умолчания — ошибка, а не тихий пропуск", () => {
    // Иначе человек настроил одно, а получил другое, и узнать об этом неоткуда.
    const parsed = parse({
      version: 1,
      rows: "",
      fields: [{ target: "/a", from: "/b", onFail: "default" }],
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe("правило №1: выбрано «подставить умолчание», но само умолчание не задано");
    }
  });

  it("два правила на одно поле — противоречие с адресом", () => {
    const parsed = parse({
      version: 1,
      rows: "",
      fields: [
        { target: "/a", from: "/x" },
        { target: "/a", from: "/y" },
      ],
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe("правило №2: поле «/a» уже заполняется выше");
  });

  it("слишком длинная цепочка не читается вовсе", () => {
    const parsed = parse({
      version: 1,
      rows: "",
      fields: [
        { target: "/a", from: "/b", steps: Array.from({ length: 40 }, () => ({ kind: "trim" })) },
      ],
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe("правило №1: шагов больше 32");
  });
});
