// Конструктор проверяется РЕНДЕРОМ в документ: собрали условие → посмотрели, что состояние
// изменилось и что на экране написано то же самое.
//
// Отдельно проверяется помощь при вводе — WCAG 2.2: ошибка названа текстом (3.3.1), поле
// помечено недействительным, известная поправка предложена (3.3.3).

import { afterEach, describe, expect, it } from "vitest";
import { createSignal } from "solid-js";

import { FilterBuilder } from "../src/filters/ui/filter-builder.jsx";
import type { FieldDictionary, FilterState } from "../src/filters/model.js";
import { EMPTY_FILTER } from "../src/filters/model.js";
import type { Row } from "../src/filters/field.js";
import { all, cleanup, mount, one, press, type } from "./dom.jsx";

afterEach(cleanup);

const FIELDS: FieldDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/passport", label: "паспорт", type: "text" },
];

const ROWS: Row[] = [
  { applicant: "Иванов", amount: 100, passport: "4510" },
  { applicant: "Петров", amount: 300 },
  { amount: 500 },
];

/** Конструктор управляемый — в тесте ему нужен держатель состояния. */
function setup(initial: FilterState = EMPTY_FILTER) {
  const [state, setState] = createSignal(initial);
  const host = mount(() => (
    <FilterBuilder fields={FIELDS} rows={ROWS} state={state()} onChange={setState} />
  ));
  return { host, state };
}

function click(host: ParentNode, text: string): void {
  const button = all<HTMLButtonElement>(host, "button").find((node) => node.textContent?.trim() === text);
  if (!button) throw new Error(`не нашлась кнопка «${text}»`);
  press(button);
}

describe("сборка условий", () => {
  it("рисует корень с зацепкой и пустым списком", () => {
    const { host } = setup();

    expect(one(host, "[data-slot~='filter-builder']")).toBeTruthy();
    expect(all(host, "[data-slot~='filter-condition']")).toHaveLength(0);
  });

  it("добавляет условие сравнения и нумерует его", () => {
    const { host, state } = setup();

    click(host, "+ сравнение");

    expect(state().conditions).toHaveLength(1);
    expect(state().conditions[0]!.kind).toBe("compare");
    expect(one(host, "[data-slot~='filter-condition-number']").textContent).toBe("1");
  });

  it("добавляет остальные виды условий", () => {
    const { host, state } = setup();

    click(host, "+ одно из списка");
    click(host, "+ диапазон");
    click(host, "+ наличие полей");

    expect(state().conditions.map((condition) => condition.kind)).toEqual([
      "in",
      "between",
      "presence",
    ]);
  });

  it("диапазон встаёт на поле, которое диапазон поддерживает", () => {
    // Первое поле в словаре текстовое; условие обязано выбрать числовое, а не встать в
    // невозможное сочетание.
    const { host, state } = setup();

    click(host, "+ диапазон");

    const condition = state().conditions[0]!;
    expect(condition.kind === "between" && condition.field).toBe("/amount");
  });

  it("набор операторов сужается типом поля", () => {
    const { host } = setup();
    click(host, "+ сравнение");

    const operators = () =>
      all<HTMLOptionElement>(host, "[data-slot~='filter-condition-operator'] option").map((node) => node.value);

    expect(operators()).toContain("contains");

    const field = one<HTMLSelectElement>(host, "[data-slot~='filter-condition-field']");
    field.value = "/amount";
    field.dispatchEvent(new Event("change", { bubbles: true }));

    // У числа подстроки нет: она сравнивала бы текстовый вид числа.
    expect(operators()).not.toContain("contains");
    expect(operators()).toContain("ge");
  });

  it("убирает условие по кнопке", () => {
    const { host, state } = setup();
    click(host, "+ сравнение");

    press(one(host, "[data-slot~='filter-condition-remove']"));

    expect(state().conditions).toHaveLength(0);
  });
});

describe("счётчик условия", () => {
  it("показывает «оставляет N из M» и отдельно неизвестные", () => {
    const { host } = setup({
      version: 1,
      conditions: [
        { id: "c1", kind: "compare", field: "/applicant", operator: "contains", value: "ов" },
      ],
      logic: { mode: "all" },
    });

    const count = one(host, "[data-slot~='filter-condition-count']");
    expect(count.textContent).toContain("оставляет 2 из 3");
    // Третья строка без поля — это НЕ «не подошла», и на экране это разные вещи.
    expect(one(host, "[data-slot~='filter-condition-unknown']").textContent).toBe(", неизвестно 1");
  });

  it("без неизвестных отдельной строки нет", () => {
    const { host } = setup({
      version: 1,
      conditions: [{ id: "c1", kind: "compare", field: "/amount", operator: "gt", value: "200" }],
      logic: { mode: "all" },
    });

    expect(one(host, "[data-slot~='filter-condition-count']").textContent).toContain("оставляет 2 из 3");
    expect(host.querySelector("[data-slot~='filter-condition-unknown']")).toBeNull();
  });
});

describe("своя логика", () => {
  const withTwo = (): FilterState => ({
    version: 1,
    conditions: [
      { id: "c1", kind: "compare", field: "/applicant", operator: "contains", value: "ов" },
      { id: "c2", kind: "compare", field: "/amount", operator: "gt", value: "200" },
    ],
    logic: { mode: "all" },
  });

  it("включается флажком и заполняется формулой по умолчанию", () => {
    const { host, state } = setup(withTwo());

    const toggle = one<HTMLInputElement>(host, "[data-slot~='filter-logic-toggle'] input");
    toggle.click();

    expect(state().logic.mode).toBe("formula");
    expect(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']").value).toBe("1 И 2");
  });

  it("флажок недоступен, пока условий нет", () => {
    const { host } = setup();
    expect(one<HTMLInputElement>(host, "[data-slot~='filter-logic-toggle'] input").disabled).toBe(true);
  });

  it("разобранная формула уезжает в состояние деревом по идентификаторам", () => {
    const { host, state } = setup(withTwo());
    one<HTMLInputElement>(host, "[data-slot~='filter-logic-toggle'] input").click();

    type(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']"), "1 ИЛИ 2");

    expect(state().logic).toEqual({
      mode: "formula",
      expr: { t: "or", a: { t: "ref", id: "c1" }, b: { t: "ref", id: "c2" } },
    });
  });

  it("сломанная формула названа ТЕКСТОМ и помечена недействительной (WCAG 3.3.1)", () => {
    const { host, state } = setup(withTwo());
    one<HTMLInputElement>(host, "[data-slot~='filter-logic-toggle'] input").click();

    type(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']"), "(1 И 2");

    expect(one(host, "[data-slot~='filter-logic-error']").textContent).toContain("не хватает закрывающей скобки");
    expect(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']").getAttribute("aria-invalid")).toBe("true");
    // Недописанная формула в состояние НЕ уезжает: там лежит последнее разобранное дерево.
    expect(state().logic).toEqual({
      mode: "formula",
      expr: { t: "and", a: { t: "ref", id: "c1" }, b: { t: "ref", id: "c2" } },
    });
  });

  it("известная поправка предложена кнопкой (WCAG 3.3.3)", () => {
    const { host, state } = setup(withTwo());
    one<HTMLInputElement>(host, "[data-slot~='filter-logic-toggle'] input").click();
    type(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']"), "1 И");

    const fix = one(host, "[data-slot~='filter-logic-fix']");
    expect(fix.textContent).toBe("подставить «1 И 2»");

    press(fix);

    expect(host.querySelector("[data-slot~='filter-logic-error']")).toBeNull();
    expect(state().logic).toEqual({
      mode: "formula",
      expr: { t: "and", a: { t: "ref", id: "c1" }, b: { t: "ref", id: "c2" } },
    });
  });

  it("условие, не упомянутое в формуле, названо — иначе оно молча не работает", () => {
    const { host } = setup({
      ...withTwo(),
      logic: { mode: "formula", expr: { t: "ref", id: "c1" } },
    });

    expect(one(host, "[data-slot~='filter-logic-unused']").textContent).toContain("2");
  });

  it("удаление условия, на которое ссылается формула, — видимое событие, а не сдвиг номеров", () => {
    // Ровно та поломка, ради которой формула перестала хранить номера.
    const { host, state } = setup({
      version: 1,
      conditions: [
        { id: "c1", kind: "compare", field: "/applicant", operator: "contains", value: "ов" },
        { id: "c2", kind: "compare", field: "/amount", operator: "gt", value: "200" },
      ],
      logic: { mode: "formula", expr: { t: "or", a: { t: "ref", id: "c1" }, b: { t: "ref", id: "c2" } } },
    });

    press(all(host, "[data-slot~='filter-condition-remove']")[0]!);

    expect(state().conditions).toHaveLength(1);
    expect(one(host, "[data-slot~='filter-logic-error']").textContent).toContain("удалено");
    // Второе условие стало первым НА ЭКРАНЕ, но формула про это знает и показывает пропажу.
    expect(one<HTMLInputElement>(host, "[data-slot~='filter-logic-input']").value).toBe("? ИЛИ 1");
  });
});
