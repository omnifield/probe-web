// ПОКРЫТИЕ — «чего скин ещё не одел».
//
// Проверяется на ЖИВЫХ паспортах: у кнопки семь объявленных состояний, и перечень непокрытого
// имеет смысл ровно постольку, поскольку он выведен из настоящего объявления, а не из
// придуманного пробой.

import { describe, expect, it, vi } from "vitest";

import { skinGaps, type SkinGap } from "../src/coverage.js";
import type { Skin } from "../src/model.js";
import { buttonPassport, fieldPassport } from "./passports.js";
import { buttonSkin, dressedSkin } from "./skins.js";

/** Пробелы одним компактным перечнем — сравнивать удобнее их, а пояснение читает человек. */
function shorthand(gaps: readonly SkinGap[]): string[] {
  return gaps.map((gap) =>
    gap.kind === "component"
      ? gap.component
      : gap.kind === "part"
        ? `${gap.component}.${gap.part}`
        : `${gap.component}.${gap.part}:${gap.state}`,
  );
}

describe("ответ — значение", () => {
  it("перечень возвращается, а не печатается", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const gaps = skinGaps(buttonSkin, [buttonPassport]);

    expect(Array.isArray(gaps)).toBe(true);
    expect(debug).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("у каждого пробела есть пояснение человеку", () => {
    for (const gap of skinGaps(buttonSkin, [buttonPassport, fieldPassport])) {
      expect(gap.means.length).toBeGreaterThan(0);
    }
  });
});

describe("одетое не считается непокрытым", () => {
  it("скин, одевший кнопку целиком, даёт по ней ПУСТО", () => {
    expect(skinGaps(dressedSkin, [buttonPassport])).toEqual([]);
  });

  it("состояния, одетые вариацией и пересечением, тоже засчитаны", () => {
    // В пробном скине наведение приходит и базой, и пересечением; засчитаться должно один раз и
    // без разницы, откуда правило пришло.
    expect(shorthand(skinGaps(buttonSkin, [buttonPassport]))).not.toContain("button.root:hover");
  });
});

describe("непокрытое перечисляется", () => {
  it("компонент без рецепта — ОДИН пробел, а не пробел на каждую его часть", () => {
    const gaps = skinGaps(buttonSkin, [buttonPassport, fieldPassport]);
    const field = gaps.filter((gap) => gap.component === fieldPassport.component);

    expect(field).toHaveLength(1);
    expect(field[0]!.kind).toBe("component");
  });

  it("часть без единого правила — пробел, и её состояния не перечисляются следом", () => {
    const skin: Skin = {
      name: "полполя",
      recipes: { field: { base: { root: { props: { display: "grid" } } } } },
    };
    const gaps = shorthand(skinGaps(skin, [fieldPassport]));

    expect(gaps).toContain("field.control");
    expect(gaps).toContain("field.label");
    // У `control` объявлены `focus` и `hover` — но часть не одета вовсе, и разворачивать это в
    // три строки значит утопить в них ответ.
    expect(gaps.filter((gap) => gap.startsWith("field.control"))).toEqual(["field.control"]);
  });

  it("объявленное состояние одетой части — пробел", () => {
    const gaps = shorthand(skinGaps(buttonSkin, [buttonPassport]));

    // Пробный скин одевает наведение, фокус, отключённость и занятость; остальные три —
    // нажатие, раскрытие и нажатость переключателя — не одеты.
    expect(gaps).toEqual([
      "button.root:active",
      "button.root:expanded",
      "button.root:pressed",
    ]);
  });

  it("порядок — паспорта, затем анатомии, затем объявления состояний", () => {
    const skin: Skin = {
      name: "пусто",
      recipes: { field: { base: { root: { props: { display: "grid" } } } } },
    };
    const gaps = shorthand(skinGaps(skin, [fieldPassport, buttonPassport]));

    expect(gaps).toEqual([
      // порядок анатомии поля: root → control → label
      "field.root:disabled",
      "field.root:invalid",
      "field.control",
      "field.label",
      // и только потом второй паспорт
      "button",
    ]);
  });
});

describe("проверено мутацией: снятое правило появляется в перечне", () => {
  /** Тот же одетый скин, но без одного состояния. */
  function without(state: string): Skin {
    const root = dressedSkin.recipes.button!.base!.root!;
    const states = { ...root.states };
    delete (states as Record<string, unknown>)[state];

    return {
      ...dressedSkin,
      recipes: { button: { base: { root: { ...root, states } } } },
    };
  }

  it("снятое состояние всплывает, и ровно оно одно", () => {
    expect(skinGaps(dressedSkin, [buttonPassport])).toEqual([]);
    expect(shorthand(skinGaps(without("disabled"), [buttonPassport]))).toEqual([
      "button.root:disabled",
    ]);
  });

  it("снятая часть всплывает частью, а не семью состояниями", () => {
    const bald: Skin = { name: "лысая", recipes: { button: {} } };

    expect(shorthand(skinGaps(bald, [buttonPassport]))).toEqual(["button.root"]);
  });

  it("снятый рецепт всплывает компонентом", () => {
    expect(shorthand(skinGaps({ name: "ничего", recipes: {} }, [buttonPassport]))).toEqual([
      "button",
    ]);
  });
});

describe("границы", () => {
  it("своего перечня компонентов нет: пустой перечень — пустой ответ", () => {
    expect(skinGaps(dressedSkin, [])).toEqual([]);
  });

  it("ненаблюдаемого не считаем: рецепт на компонент вне перечня в ответ не попадает", () => {
    // Механика сообщает о ДОЛГЕ по объявленному, а не о лишнем. Про рецепт без паспорта говорит
    // проверка (`unknown-component`), и это другой разговор.
    expect(skinGaps(buttonSkin, [])).toEqual([]);
  });

  it("часть, упомянутая только как ПРЕДОК, одетой не считается", () => {
    const skin: Skin = {
      name: "предок",
      recipes: {
        field: {
          base: {
            root: { props: { display: "grid" } },
            label: { props: { color: "black" } },
            control: {
              ancestors: [
                {
                  component: "field",
                  part: "root",
                  states: ["disabled"],
                  style: { props: { color: "grey" } },
                },
              ],
            },
          },
        },
      },
    };
    const gaps = shorthand(skinGaps(skin, [fieldPassport]));

    // `field.root` одет своим правилом, а вот его состояние `disabled` — нет: оно тут условие,
    // а вид получает `control`.
    expect(gaps).toContain("field.root:disabled");
    // Сам `control` при этом одет — правило с предком даёт вид именно ему.
    expect(gaps).not.toContain("field.control");
  });

  it("скин с изъяном считается тоже: человеку нужен ответ, а не отказ", () => {
    const broken: Skin = {
      name: "битый",
      recipes: {
        button: { base: { root: { props: { color: "var(--нет-такого)" } } } },
      },
    };

    expect(() => skinGaps(broken, [buttonPassport])).not.toThrow();
    expect(shorthand(skinGaps(broken, [buttonPassport]))).toContain("button.root:hover");
  });

  it("полнота не навязывается: неодетое — перечень, а не исключение", () => {
    expect(() => skinGaps({ name: "пусто", recipes: {} }, [buttonPassport])).not.toThrow();
  });
});
