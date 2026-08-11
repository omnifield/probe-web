// Применение адаптера целиком: чужой ответ → наш канон плюс отчёт.

import { describe, expect, it } from "vitest";

import { applyAdapter } from "../src/adapter/apply.js";
import type { AdapterSpec } from "../src/adapter/model.js";

/** Типичный чужой ответ: набор завёрнут, имена свои, суммы в копейках, статусы кодами. */
const RESPONSE = {
  ok: true,
  data: {
    items: [
      {
        client: { last: "Иванов", first: "Иван" },
        amount_cents: "125000",
        created_at: "11.08.2026",
        status_code: "1",
        mobile: "",
        work_phone: "+7 495 000-00-00",
        legacy_id: "A-1",
      },
      {
        client: { last: "Петров", first: "Пётр" },
        amount_cents: "70000",
        created_at: "01.07.2026",
        status_code: "2",
        mobile: "+7 900 111-22-33",
        legacy_id: "A-2",
      },
      {
        client: { last: "Сидоров", first: "Семён" },
        amount_cents: "неизвестно",
        created_at: "когда-то",
        status_code: "9",
      },
    ],
  },
};

const SPEC: AdapterSpec = {
  version: 1,
  rows: "/data/items",
  fields: [
    {
      target: "/applicant",
      from: "/client/last",
      steps: [{ kind: "concat", parts: [{ from: "/client/first" }] }],
    },
    { target: "/amount", from: "/amount_cents", steps: [{ kind: "number" }, { kind: "divide", by: 100 }] },
    { target: "/created", from: "/created_at", steps: [{ kind: "date", from: "dmy" }] },
    {
      target: "/status",
      from: "/status_code",
      steps: [{ kind: "dictionary", values: { "1": "новая", "2": "в работе" }, otherwise: "fail" }],
    },
    { target: "/contact/phone", steps: [{ kind: "coalesce", from: ["/mobile", "/work_phone"] }] },
  ],
};

describe("приведение к канону", () => {
  it("собирает наши строки из их формы", () => {
    const { rows, error } = applyAdapter(RESPONSE, SPEC);

    expect(error).toBeNull();
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      applicant: "Иванов Иван",
      amount: 1250,
      created: "2026-08-11T00:00:00.000Z",
      status: "новая",
      contact: { phone: "+7 495 000-00-00" },
    });
  });

  it("вложенность собирается по пути, а не плоским ключом", () => {
    const { rows } = applyAdapter(RESPONSE, SPEC);
    expect(rows[1]).toMatchObject({ contact: { phone: "+7 900 111-22-33" } });
  });

  it("не собравшееся поле просто отсутствует — а «поля нет» у нас значимо", () => {
    const { rows } = applyAdapter(RESPONSE, SPEC);
    const third = rows[2]!;

    expect(third["applicant"]).toBe("Сидоров Семён");
    expect("amount" in third).toBe(false);
    expect("created" in third).toBe(false);
    expect("status" in third).toBe(false);
  });
});

describe("отчёт", () => {
  it("считает строки и объясняет, что не легло, с примерами", () => {
    const { report } = applyAdapter(RESPONSE, SPEC);

    expect(report.total).toBe(3);
    expect(report.converted).toBe(3);
    expect(report.rejected).toBe(0);

    const amount = report.issues.find((issue) => issue.target === "/amount")!;
    expect(amount.count).toBe(1);
    expect(amount.reason).toBe("шаг 1 (number): не число");
    expect(amount.examples).toEqual(["неизвестно"]);
  });

  it("показывает их поля, для которых правил нет", () => {
    // Иначе поле, о котором забыли, пропадает молча — и найдётся через месяц.
    const { report } = applyAdapter(RESPONSE, SPEC);
    const paths = report.unmapped.map((entry) => entry.path);

    expect(paths).toContain("/legacy_id");
    // Использованное — не забытое, в том числе взятое шагом «первое непустое».
    expect(paths).not.toContain("/client/last");
    expect(paths).not.toContain("/work_phone");
    // Промежуточный узел тоже не забытый: его листья разобраны.
    expect(paths).not.toContain("/client");
  });

  it("считает, на скольких строках забытое поле заполнено", () => {
    const { report } = applyAdapter(RESPONSE, SPEC);
    expect(report.unmapped.find((entry) => entry.path === "/legacy_id")?.count).toBe(2);
  });

  it("беды выстроены по частоте — сначала то, что бьёт чаще", () => {
    const { report } = applyAdapter(RESPONSE, {
      ...SPEC,
      fields: [
        // Порядок ВСТРЕЧИ беды нарочно обратен порядку в отчёте: редкая случается на первой
        // же строке (и попадает в список первой), частая — на всех трёх. Без сортировки
        // отчёт вернул бы их в порядке встречи, и проба это ловит.
        {
          target: "/region",
          from: "/legacy_id",
          steps: [{ kind: "dictionary", values: { "A-2": "второй", "": "нет" }, otherwise: "fail" }],
        },
        { target: "/amount", from: "/created_at", steps: [{ kind: "number" }] },
      ],
    });

    expect(report.issues.map((issue) => issue.count)).toEqual([3, 1]);
    expect(report.issues[0]!.target).toBe("/amount");
    expect(report.issues[1]!.target).toBe("/region");
  });
});

describe("что делать с несобравшимся", () => {
  it("умолчание подставляется по просьбе", () => {
    const { rows } = applyAdapter(RESPONSE, {
      ...SPEC,
      fields: [{ target: "/status", from: "/status_code", steps: [{ kind: "dictionary", values: {}, otherwise: "fail" }], onFail: "default", fallback: "неизвестно" }],
    });

    expect(rows.every((row) => row["status"] === "неизвестно")).toBe(true);
  });

  it("строку можно забраковать целиком — и это видно в отчёте", () => {
    const { rows, report } = applyAdapter(RESPONSE, {
      ...SPEC,
      fields: [
        { target: "/amount", from: "/amount_cents", steps: [{ kind: "number" }], onFail: "reject" },
      ],
    });

    expect(rows).toHaveLength(2);
    expect(report.rejected).toBe(1);
    expect(report.converted).toBe(2);
  });
});

describe("лишние поля источника", () => {
  it("по умолчанию не проносятся — канон остаётся каноном", () => {
    const { rows } = applyAdapter(RESPONSE, SPEC);
    expect("status_code" in rows[0]!).toBe(false);
  });

  it("по просьбе проносятся как есть", () => {
    const { rows } = applyAdapter(RESPONSE, { ...SPEC, extra: "keep" });
    expect(rows[0]!["status_code"]).toBe("1");
    // Наши правила при этом всё равно главнее.
    expect(rows[0]!["amount"]).toBe(1250);
  });
});

describe("набор строк не нашёлся", () => {
  it("это ОШИБКА целиком, а не «ничего не легло»", () => {
    // Разница существенная: «не туда смотрим» чинится одним полем, «не легло» — правилами.
    const { rows, error } = applyAdapter(RESPONSE, { ...SPEC, rows: "/data/rows" });

    expect(rows).toEqual([]);
    expect(error).toBe("по пути «/data/rows» набора строк нет");
  });

  it("пустой путь означает «ответ и есть массив»", () => {
    const { rows, error } = applyAdapter([{ client: { last: "Иванов", first: "И." } }], {
      ...SPEC,
      rows: "",
    });

    expect(error).toBeNull();
    expect(rows[0]!["applicant"]).toBe("Иванов И.");
  });

  it("ответ не массив — сказано прямо", () => {
    const { error } = applyAdapter({ ok: true }, { ...SPEC, rows: "" });
    expect(error).toBe("в ответе ожидался массив строк, а пришло что-то другое");
  });
});
