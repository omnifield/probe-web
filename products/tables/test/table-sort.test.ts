// Сравнение для сортировки. Главное здесь — место пустого значения: оно взято у SQL, а не
// придумано, и одно правило «пустое больше любого непустого» даёт оба умолчания разом.

import { describe, expect, it } from "vitest";

import { compareValues } from "../src/table/sort.js";

const sign = (value: number) => Math.sign(value);

describe("место пустого значения", () => {
  it.each([null, undefined, "", "   "])("«%s» больше любого непустого", (blank) => {
    // PostgreSQL: «null values sort as if larger than any non-null value». Сравниваем по
    // возрастанию, разворот делает движок — значит пустые уходят в конец при «по возрастанию»
    // и в начало при «по убыванию», ровно как умолчания SQL.
    expect(sign(compareValues(blank, "Иванов", "text"))).toBe(1);
    expect(sign(compareValues("Иванов", blank, "text"))).toBe(-1);
  });

  it("два пустых равны", () => {
    expect(compareValues(null, undefined, "text")).toBe(0);
  });

  it("значение, не разбираемое по типу, попадает в ту же корзину, что и пустое", () => {
    // Притворяться, что «много» это число, значит расставить строки в порядке, которого
    // никто не просил.
    expect(sign(compareValues("много", 10, "number"))).toBe(1);
    expect(sign(compareValues("вчера", "2026-01-01", "date"))).toBe(1);
  });
});

describe("сравнение по типу", () => {
  it("числа — числами, а не текстом", () => {
    expect(sign(compareValues(9, 10, "number"))).toBe(-1);
    expect(sign(compareValues("9", "10", "number"))).toBe(-1);
  });

  it("даты — датами, в обеих записях", () => {
    expect(sign(compareValues("2026-01-02", "2026-01-10", "date"))).toBe(-1);
    expect(sign(compareValues("02.01.2026", "10.01.2026", "date"))).toBe(-1);
  });

  it("ложь меньше истины", () => {
    expect(sign(compareValues(false, true, "bool"))).toBe(-1);
    expect(compareValues(true, "да", "bool")).toBe(0);
  });

  it("текст сравнивается с учётом языка, а не по кодам символов", () => {
    expect(sign(compareValues("ёлка", "жаба", "text", "ru-RU"))).toBe(-1);
    // «ё» на первом уровне сравнения РАВНА «е», поэтому решает вторая буква: «л» < «н».
    // Сравнение по кодам символов дало бы обратное — «ё» лежит в конце кодовой таблицы.
    expect(sign(compareValues("ёлка", "енот", "text", "ru-RU"))).toBe(-1);
    expect(sign("ёлка" > "енот" ? 1 : -1)).toBe(1);
  });

  it("равные значения дают ноль — тай-брейкер добавляет таблица, а не сравнение", () => {
    expect(compareValues("Иванов", "Иванов", "text")).toBe(0);
    expect(compareValues(100, "100", "number")).toBe(0);
  });
});
