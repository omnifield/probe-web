// Состояние сеанса: страница, раскрытие, выделение, закрепление строк.
//
// Здесь же проверяется главное свойство листания смещением — что страница не убегает за край
// набора, когда набор сократился отбором.

import { describe, expect, it } from "vitest";

import { EMPTY_SESSION } from "../src/table/model.js";
import {
  clampPage,
  expandAll,
  goToPage,
  isExpanded,
  isSelected,
  pageCount,
  pinnedRowEdge,
  pinRow,
  setSelected,
  toggleExpanded,
  toggleSelected,
} from "../src/table/session.js";

describe("раскрытие групп", () => {
  it("раскрывает и сворачивает по одной", () => {
    const open = toggleExpanded(EMPTY_SESSION, "g1", ["g1", "g2"]);
    expect(isExpanded(open, "g1")).toBe(true);
    expect(isExpanded(open, "g2")).toBe(false);

    const closed = toggleExpanded(open, "g1", ["g1", "g2"]);
    expect(isExpanded(closed, "g1")).toBe(false);
  });

  it("«раскрыть все» — одно состояние, а не перечень", () => {
    const all = expandAll(EMPTY_SESSION, true);
    expect(all.expanded).toBe("all");
    expect(isExpanded(all, "какая угодно группа")).toBe(true);
  });

  it("сворачивание одной группы из «всех» разворачивает состояние в перечень", () => {
    // Иначе пришлось бы хранить «всё, кроме» и толковать два разных смысла одного поля.
    const all = expandAll(EMPTY_SESSION, true);
    const one = toggleExpanded(all, "g2", ["g1", "g2", "g3"]);

    expect(one.expanded).toEqual(["g1", "g3"]);
    expect(isExpanded(one, "g2")).toBe(false);
    expect(isExpanded(one, "g1")).toBe(true);
  });
});

describe("выделение строк", () => {
  it("выделяет и снимает", () => {
    const one = toggleSelected(EMPTY_SESSION, "r1");
    expect(isSelected(one, "r1")).toBe(true);
    expect(isSelected(toggleSelected(one, "r1"), "r1")).toBe(false);
  });

  it("выделение списком заменяет прежнее целиком", () => {
    const some = setSelected(EMPTY_SESSION, ["r1", "r2"]);
    expect(setSelected(some, []).selected).toEqual([]);
  });
});

describe("закрепление строк", () => {
  it("прижимает к верху и отпускает", () => {
    const top = pinRow(EMPTY_SESSION, "r1", "top");
    expect(pinnedRowEdge(top, "r1")).toBe("top");
    expect(pinnedRowEdge(pinRow(top, "r1", null), "r1")).toBeNull();
  });

  it("прижатие к другому краю снимает с прежнего", () => {
    const bottom = pinRow(pinRow(EMPTY_SESSION, "r1", "top"), "r1", "bottom");
    expect(bottom.pinnedRows).toEqual({ top: [], bottom: ["r1"] });
  });
});

describe("листание", () => {
  it("считает страницы", () => {
    expect(pageCount(0, 10)).toBe(1);
    expect(pageCount(10, 10)).toBe(1);
    expect(pageCount(11, 10)).toBe(2);
    expect(pageCount(100, null)).toBe(1);
  });

  it("не пускает за края", () => {
    const last = goToPage(EMPTY_SESSION, 99, 25, 10);
    expect(last.page).toBe(2);
    expect(goToPage(EMPTY_SESSION, -5, 25, 10).page).toBe(0);
  });

  it("после сокращения набора страница подтягивается, а не показывает пустоту", () => {
    // Отбор оставил три строки — страницы №7 больше нет, и пустой экран соврал бы,
    // что данных нет вовсе.
    const far = goToPage(EMPTY_SESSION, 6, 70, 10);
    expect(far.page).toBe(6);

    const fixed = clampPage(far, 3, 10);
    expect(fixed.page).toBe(0);
  });

  it("страница в границах не трогается — состояние остаётся тем же объектом", () => {
    const session = goToPage(EMPTY_SESSION, 1, 100, 10);
    expect(clampPage(session, 100, 10)).toBe(session);
  });
});
