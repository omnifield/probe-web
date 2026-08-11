// Действия адаптера. Набор закрытый, поэтому проверяется весь — и то, ЧТО он умеет, и то,
// как он объясняет, когда не вышло.

import { describe, expect, it } from "vitest";

import { MAX_STEPS, type Step } from "../src/adapter/model.js";
import { isBlank, runStep, runSteps } from "../src/adapter/steps.js";
import type { Row } from "../src/filters/index.js";

const SOURCE: Row = {
  last_name: "Иванов",
  first_name: "Иван",
  middle_name: "",
  phone: "+7 900 111-22-33",
  amount_cents: "125000",
  created_at: "11.08.2026",
  status_code: "1",
  mobile: "",
  work_phone: "+7 495 000-00-00",
};

const run = (step: Step, value: unknown) => runStep(step, value, SOURCE);

describe("текст", () => {
  it("обрезает, опускает и поднимает регистр", () => {
    expect(run({ kind: "trim" }, "  Иванов  ")).toEqual({ ok: true, value: "Иванов" });
    expect(run({ kind: "lower" }, "ИВАНОВ")).toEqual({ ok: true, value: "иванов" });
    expect(run({ kind: "upper" }, "иванов")).toEqual({ ok: true, value: "ИВАНОВ" });
  });

  it("пустое значение не превращается в строку «null»", () => {
    expect(run({ kind: "trim" }, null)).toEqual({ ok: true, value: null });
    expect(run({ kind: "upper" }, undefined)).toEqual({ ok: true, value: undefined });
  });

  it("склеивает с другими полями источника и постоянными кусками", () => {
    const step: Step = {
      kind: "concat",
      parts: [{ from: "/first_name" }, { from: "/middle_name" }],
      separator: " ",
    };
    expect(run(step, "Иванов")).toEqual({ ok: true, value: "Иванов Иван" });
  });

  it("пустые куски выбрасывает, а не оставляет двойной пробел", () => {
    // «Иванов  Иван» с дырой посередине видит каждый, кто получит такой список.
    const step: Step = {
      kind: "concat",
      parts: [{ from: "/middle_name" }, { from: "/first_name" }],
    };
    expect(run(step, "")).toEqual({ ok: true, value: "Иван" });
  });

  it("склеивать нечего — это названо, а не пустая строка", () => {
    expect(run({ kind: "concat", parts: [{ from: "/middle_name" }] }, "")).toEqual({
      ok: false,
      reason: "склеивать нечего",
    });
  });

  it("режет и берёт кусок, в том числе с конца", () => {
    expect(run({ kind: "split", separator: " ", take: 0 }, "Иванов Иван")).toEqual({
      ok: true,
      value: "Иванов",
    });
    expect(run({ kind: "split", separator: " ", take: -1 }, "Иванов Иван Иванович")).toEqual({
      ok: true,
      value: "Иванович",
    });
  });

  it("куска нет — причина названа с номером", () => {
    expect(run({ kind: "split", separator: ";", take: 5 }, "а;б")).toEqual({
      ok: false,
      reason: "куска №5 нет",
    });
  });

  it("заменяет подстроку целиком, а не первое вхождение", () => {
    expect(run({ kind: "replace", find: "-", with: "" }, "111-22-33")).toEqual({
      ok: true,
      value: "1112233",
    });
  });
});

describe("числа", () => {
  it("понимает разделители разрядов и запятую", () => {
    // Ровно то, что приезжает строкой из чужих выгрузок.
    expect(run({ kind: "number" }, "1 250 000")).toEqual({ ok: true, value: 1_250_000 });
    expect(run({ kind: "number" }, "3,14")).toEqual({ ok: true, value: 3.14 });
  });

  it("не число — так и говорит", () => {
    // Причина БЕЗ значения: одинаковые беды складываются в отчёте в одну строку, а само
    // значение уезжает в примеры.
    expect(run({ kind: "number" }, "много")).toEqual({ ok: false, reason: "не число" });
  });

  it("копейки в рубли — это деление на сто", () => {
    expect(run({ kind: "divide", by: 100 }, "125000")).toEqual({ ok: true, value: 1250 });
  });

  it("деление на ноль не даёт бесконечность молча", () => {
    expect(run({ kind: "divide", by: 0 }, "10")).toEqual({ ok: false, reason: "деление на ноль" });
  });

  it("округляет до знаков", () => {
    expect(run({ kind: "round", digits: 2 }, 3.14159)).toEqual({ ok: true, value: 3.14 });
    expect(run({ kind: "round" }, 3.7)).toEqual({ ok: true, value: 4 });
  });
});

describe("даты и да/нет", () => {
  it("разбирает наш формат, ISO и секунды с начала эпохи", () => {
    expect(run({ kind: "date", from: "dmy" }, "11.08.2026")).toEqual({
      ok: true,
      value: "2026-08-11T00:00:00.000Z",
    });
    expect(run({ kind: "date" }, "2026-08-11")).toEqual({
      ok: true,
      value: "2026-08-11T00:00:00.000Z",
    });
    expect(run({ kind: "date", from: "unix" }, 1_770_768_000)).toMatchObject({ ok: true });
  });

  it("не дата — названо значение, а не «ошибка разбора»", () => {
    expect(run({ kind: "date", from: "dmy" }, "вчера")).toEqual({
      ok: false,
      reason: "не дата вида дд.мм.гггг",
    });
  });

  it("понимает да/нет словами и числами", () => {
    expect(run({ kind: "bool" }, "1")).toEqual({ ok: true, value: true });
    expect(run({ kind: "bool" }, "нет")).toEqual({ ok: true, value: false });
    expect(run({ kind: "bool" }, "может")).toEqual({ ok: false, reason: "не да и не нет" });
  });
});

describe("словарь, первое непустое, умолчание", () => {
  const dictionary: Step = {
    kind: "dictionary",
    values: { "1": "новая", "2": "в работе" },
  };

  it("заменяет их коды нашими значениями", () => {
    expect(run(dictionary, "1")).toEqual({ ok: true, value: "новая" });
  });

  it("незнакомый код по умолчанию проносит как есть", () => {
    expect(run(dictionary, "9")).toEqual({ ok: true, value: "9" });
  });

  it("а по просьбе — считает несопоставимым", () => {
    expect(run({ ...dictionary, otherwise: "fail" } as Step, "9")).toEqual({
      ok: false,
      reason: "нет в словаре",
    });
  });

  it("берёт первое непустое из перечисленных путей", () => {
    expect(run({ kind: "coalesce", from: ["/mobile", "/work_phone"] }, undefined)).toEqual({
      ok: true,
      value: "+7 495 000-00-00",
    });
  });

  it("все пусты — это названо", () => {
    expect(run({ kind: "coalesce", from: ["/mobile", "/middle_name"] }, undefined)).toEqual({
      ok: false,
      reason: "все перечисленные поля пусты",
    });
  });

  it("умолчание подставляется только вместо пустого", () => {
    expect(run({ kind: "default", value: "—" }, "")).toEqual({ ok: true, value: "—" });
    expect(run({ kind: "default", value: "—" }, "есть")).toEqual({ ok: true, value: "есть" });
  });

  it("постоянное значение не смотрит на их данные вовсе", () => {
    expect(run({ kind: "constant", value: "заявка" }, "что угодно")).toEqual({
      ok: true,
      value: "заявка",
    });
  });
});

describe("цепочка", () => {
  it("шаги идут по порядку", () => {
    const steps: Step[] = [{ kind: "number" }, { kind: "divide", by: 100 }, { kind: "round", digits: 2 }];
    expect(runSteps(steps, "125000", SOURCE)).toEqual({ ok: true, value: 1250 });
  });

  it("обрывается на первой неудаче и называет НОМЕР шага", () => {
    // Иначе получишь второе, ложное объяснение вместо первого, настоящего.
    const steps: Step[] = [{ kind: "trim" }, { kind: "number" }, { kind: "divide", by: 100 }];
    expect(runSteps(steps, " много ", SOURCE)).toEqual({
      ok: false,
      reason: "шаг 2 (number): не число",
    });
  });

  it("слишком длинная цепочка не выполняется", () => {
    // Не про безопасность выражений — действия объявлены, — а про подменённый файл с тысячей
    // шагов: вкладка не должна вставать колом из-за чужой опечатки.
    const steps: Step[] = Array.from({ length: MAX_STEPS + 1 }, () => ({ kind: "trim" }) as Step);
    expect(runSteps(steps, "а", SOURCE)).toEqual({
      ok: false,
      reason: `шагов больше ${MAX_STEPS} — цепочка не выполняется`,
    });
  });

  it("пустая цепочка отдаёт значение как есть", () => {
    expect(runSteps([], "Иванов", SOURCE)).toEqual({ ok: true, value: "Иванов" });
  });
});

describe("что считается пустым", () => {
  it.each([null, undefined, "", "   ", []])("%s — пусто", (value) => {
    expect(isBlank(value)).toBe(true);
  });

  it.each([0, false, "0", "нет"])("%s — НЕ пусто", (value) => {
    // Ноль и «нет» — законные значения; спутать их с пустотой значит потерять данные.
    expect(isBlank(value)).toBe(false);
  });
});
