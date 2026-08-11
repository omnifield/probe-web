// Ссылка на поле — JSON Pointer (RFC 6901). Проверяется то, ради чего он и взят вместо
// точечной нотации: экранирование разделителя и порядок раскодирования.

import { describe, expect, it } from "vitest";

import {
  hasField,
  isFilled,
  isFieldRef,
  lookup,
  parsePointer,
  toFieldRef,
} from "../src/filters/field.js";

describe("разбор указателя", () => {
  it("пустая строка — указатель на всю строку данных", () => {
    expect(parsePointer("")).toEqual([]);
    expect(isFieldRef("")).toBe(true);
  });

  it("строка без ведущей косой черты указателем не является", () => {
    expect(parsePointer("phone")).toBeNull();
    expect(isFieldRef("phone")).toBe(false);
  });

  it("токены разделяются косой чертой", () => {
    expect(parsePointer("/contact/phone")).toEqual(["contact", "phone"]);
  });

  it("`~1` раскодируется в `/`, `~0` — в `~`", () => {
    expect(parsePointer("/a~1b")).toEqual(["a/b"]);
    expect(parsePointer("/a~0b")).toEqual(["a~b"]);
  });

  it("порядок раскодирования — сначала `~1`, потом `~0`: `~01` не превращается в `/`", () => {
    // Единственный случай, где наивная замена соврала бы; RFC называет его дословно.
    expect(parsePointer("/a~01b")).toEqual(["a~1b"]);
  });

  it("сборка указателя экранирует и `~`, и `/`", () => {
    expect(toFieldRef(["a/b"])).toBe("/a~1b");
    expect(toFieldRef(["a~b"])).toBe("/a~0b");
    expect(parsePointer(toFieldRef(["a~1b"]))).toEqual(["a~1b"]);
  });
});

describe("обход строки", () => {
  const row = {
    applicant: "Иванов",
    contact: { phone: "+7 900", email: "" },
    tags: ["срочно", "физлицо"],
    empty: null,
    "a/b": "поле с косой чертой в имени",
  };

  it("достаёт вложенное значение", () => {
    expect(lookup(row, "/contact/phone")).toEqual({ found: true, value: "+7 900" });
  });

  it("различает «узла нет» и «в узле null»", () => {
    expect(lookup(row, "/empty")).toEqual({ found: true, value: null });
    expect(lookup(row, "/missing")).toEqual({ found: false, value: undefined });
  });

  it("вложенного поля нет, когда нет самого объекта", () => {
    expect(lookup({ applicant: "Пётр" }, "/contact/phone").found).toBe(false);
  });

  it("элемент массива берётся по ноль-базовому индексу", () => {
    expect(lookup(row, "/tags/0").value).toBe("срочно");
    expect(lookup(row, "/tags/1").value).toBe("физлицо");
    expect(lookup(row, "/tags/2").found).toBe(false);
  });

  it("ведущий ноль индексом не считается, а `-` указывает за конец массива", () => {
    expect(lookup(row, "/tags/01").found).toBe(false);
    expect(lookup(row, "/tags/-").found).toBe(false);
  });

  it("имя поля с косой чертой адресуется через `~1` — то, чего не умеет точечная нотация", () => {
    expect(lookup(row, "/a~1b").value).toBe("поле с косой чертой в имени");
  });

  it("испорченный указатель — промах, а не исключение", () => {
    expect(lookup(row, "contact.phone").found).toBe(false);
  });
});

describe("наличие и заполненность", () => {
  const row = {
    applicant: "Иванов",
    blank: "   ",
    none: null,
    list: [] as string[],
    zero: 0,
    off: false,
    contact: { phone: "" },
  };

  it("поле есть — независимо от того, что в нём", () => {
    expect(hasField(row, "/none")).toBe(true);
    expect(hasField(row, "/contact/phone")).toBe(true);
    expect(hasField(row, "/contact/email")).toBe(false);
  });

  it("пусто: null, пустая строка, пробелы, пустой массив", () => {
    expect(isFilled(row, "/none")).toBe(false);
    expect(isFilled(row, "/blank")).toBe(false);
    expect(isFilled(row, "/list")).toBe(false);
    expect(isFilled(row, "/contact/phone")).toBe(false);
  });

  it("ноль и `false` — ЗАПОЛНЕННЫЕ значения, а не пустые", () => {
    // Иначе «сумма 0» и «не указана» слиплись бы — ровно та ошибка, которую protobuf
    // называет ценой неявного присутствия.
    expect(isFilled(row, "/zero")).toBe(true);
    expect(isFilled(row, "/off")).toBe(true);
  });

  it("отсутствующее поле не заполнено", () => {
    expect(isFilled(row, "/missing")).toBe(false);
  });
});
