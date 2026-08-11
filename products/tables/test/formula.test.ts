// Разбор и показ формулы. Главное здесь — приоритет операторов и то, что дерево ссылается
// на устойчивый `id`, а номер живёт только на экране.

import { describe, expect, it } from "vitest";

import {
  danglingIds,
  defaultExpr,
  defaultFormula,
  formatFormula,
  parseFormula,
  referencedIds,
  remapIds,
} from "../src/filters/formula.js";

const IDS = ["a", "b", "c"];

function parse(text: string, ids: readonly string[] = IDS) {
  const result = parseFormula(text, ids);
  if (!result.ok) throw new Error(`не разобралось: ${result.error}`);
  return result.expr;
}

describe("приоритет операторов", () => {
  it("`И` связывает сильнее `ИЛИ` — как в SQL и CQL2", () => {
    // Не самоочевидно: AIP-160 делает обратное, и тот же текст там значит другое.
    expect(parse("1 И 2 ИЛИ 3")).toEqual({
      t: "or",
      a: { t: "and", a: { t: "ref", id: "a" }, b: { t: "ref", id: "b" } },
      b: { t: "ref", id: "c" },
    });
  });

  it("скобки приоритет переопределяют", () => {
    expect(parse("1 И (2 ИЛИ 3)")).toEqual({
      t: "and",
      a: { t: "ref", id: "a" },
      b: { t: "or", a: { t: "ref", id: "b" }, b: { t: "ref", id: "c" } },
    });
  });

  it("`НЕ` сильнее `И`", () => {
    expect(parse("НЕ 1 И 2")).toEqual({
      t: "and",
      a: { t: "not", a: { t: "ref", id: "a" } },
      b: { t: "ref", id: "b" },
    });
  });
});

describe("запись", () => {
  it("слова и знаки — одно и то же", () => {
    expect(parse("1 & 2 | 3")).toEqual(parse("1 И 2 ИЛИ 3"));
    expect(parse("1 && 2 || 3")).toEqual(parse("1 and 2 or 3"));
    expect(parse("!1")).toEqual(parse("НЕ 1"));
  });

  it("регистр слов не важен", () => {
    expect(parse("1 и 2")).toEqual(parse("1 И 2"));
  });
});

describe("ошибки названы, а не просто «не разобрать»", () => {
  it.each([
    ["", "формула пустая"],
    ["1 И", "формула обрывается — не хватает условия"],
    ["(1 И 2", "не хватает закрывающей скобки"],
    ["1 И 2)", "лишняя закрывающая скобка"],
    ["1 2", "в конце формулы что-то лишнее"],
    ["1 ИЛИ кот", "непонятное слово «кот»"],
    ["1 # 2", "непонятный символ «#»"],
    ["4", "условия №4 нет, сейчас их 3"],
  ])("«%s» → %s", (text, error) => {
    const result = parseFormula(text, IDS);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe(error);
  });

  it("на пустом списке условий текст ошибки другой — он объясняет причину", () => {
    const result = parseFormula("1", []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("условия №1 нет — список условий пуст");
  });
});

describe("номер — это ввод и показ, а хранится `id`", () => {
  it("разбор переводит номер в идентификатор", () => {
    expect(parse("2")).toEqual({ t: "ref", id: "b" });
  });

  it("показ переводит идентификатор в ТЕКУЩИЙ номер", () => {
    const expr = parse("1 И 3");
    // Удалили первое условие: у оставшихся сместились номера, но не смысл.
    expect(formatFormula(expr, IDS)).toBe("1 И 3");
    expect(formatFormula(expr, ["b", "c"])).toBe("? И 2");
  });

  it("удалённое условие видно в показе как `?`, а не подменяется соседом", () => {
    // Ровно та поломка, ради которой формула перестала хранить номера: раньше на месте `?`
    // молча оказывалось следующее условие. Скобки при показе не выписываются — `И` и так
    // связывает сильнее `ИЛИ`, и обратный разбор даёт то же дерево (проверено ниже).
    const expr = parse("(1 И 2) ИЛИ 3");
    expect(formatFormula(expr, ["b", "c"])).toBe("? И 1 ИЛИ 2");
  });

  it("скобки в показе ставятся по приоритету, а не по тому, как их набрали", () => {
    expect(formatFormula(parse("1 И (2 ИЛИ 3)"), IDS)).toBe("1 И (2 ИЛИ 3)");
    expect(formatFormula(parse("(1 И 2) ИЛИ 3"), IDS)).toBe("1 И 2 ИЛИ 3");
  });

  it("показанное разбирается обратно в то же дерево", () => {
    const expr = parse("НЕ (1 ИЛИ 2) И 3");
    expect(parse(formatFormula(expr, IDS))).toEqual(expr);
  });
});

describe("ссылки", () => {
  it("перечисляются", () => {
    expect(referencedIds(parse("1 И (2 ИЛИ 1)"))).toEqual(new Set(["a", "b"]));
  });

  it("повисшие находятся", () => {
    expect(danglingIds(parse("1 И 3"), ["a", "b"])).toEqual(["c"]);
    expect(danglingIds(parse("1 И 2"), IDS)).toEqual([]);
  });

  it("переписываются по карте — клон пресета не ссылается в пустоту", () => {
    const mapping = new Map([
      ["a", "c9"],
      ["b", "c10"],
    ]);
    expect(remapIds(parse("1 И 2"), mapping)).toEqual({
      t: "and",
      a: { t: "ref", id: "c9" },
      b: { t: "ref", id: "c10" },
    });
  });

  it("неизвестный идентификатор при переписывании остаётся собой, а не теряется", () => {
    expect(remapIds(parse("3"), new Map([["a", "c1"]]))).toEqual({ t: "ref", id: "c" });
  });
});

describe("значения по умолчанию", () => {
  it("все условия через И", () => {
    expect(defaultExpr(IDS)).toEqual({
      t: "and",
      a: { t: "and", a: { t: "ref", id: "a" }, b: { t: "ref", id: "b" } },
      b: { t: "ref", id: "c" },
    });
    expect(defaultFormula(3)).toBe("1 И 2 И 3");
  });

  it("одно условие — дерево из одной ссылки", () => {
    expect(defaultExpr(["a"])).toEqual({ t: "ref", id: "a" });
  });

  it("условий нет — дерева нет", () => {
    expect(defaultExpr([])).toBeNull();
    expect(defaultFormula(0)).toBe("");
  });
});
