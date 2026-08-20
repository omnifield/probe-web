// СБОРКА РЕЦЕПТА — база, вариации, умолчание, пересечения — и порядок, в котором они встают.
//
// Порядок проверяется здесь, а не в порождении: он принадлежит сборке. Порождение только
// печатает то, что ему дали, и подменить неверный порядок печатью нельзя.

import { describe, expect, it } from "vitest";

import { partSelector } from "../src/address.js";
import type { Skin } from "../src/model.js";
import { checkSkin, skinRules } from "../src/rules.js";
import { buttonPassport, emptyLookup, fieldPassport, lookup } from "./passports.js";
import { buttonSkin, VOCABULARY } from "./skins.js";

const vocabulary = { tokens: VOCABULARY };

/** Собирает правила пробного скина — вход, к которому сводится большинство проверок ниже. */
function rules(skin: Skin = buttonSkin) {
  return skinRules(skin, lookup, vocabulary);
}

/** Имена изъянов — сравнивать удобнее их, а пояснение читает человек. */
function names(skin: Skin) {
  return checkSkin(skin, lookup, vocabulary).map((flaw) => flaw.name);
}

describe("рецепт собирается целиком", () => {
  it("изъянов у полного скина кнопки нет", () => {
    expect(rules().flaws).toEqual([]);
  });

  it("база даёт правило на координату части", () => {
    const own = partSelector(buttonPassport, "root")!;

    expect(rules().rules[0]).toMatchObject({ selector: own, conditions: 0, origin: 0 });
  });

  it("каждая объявленная вариация получает своё правило", () => {
    const found = rules().rules.filter((rule) => rule.origin === 1 && rule.conditions === 0);

    expect(found).toHaveLength(3);
  });

  it("умолчание адресует и отсутствие атрибута", () => {
    const selector = rules().rules.find((rule) => rule.selector.includes("главная"))!.selector;

    expect(selector).toContain(":not([data-variant])");
  });

  it("состояния разворачиваются, включая пересечение состояний вложением", () => {
    const both = rules().rules.find(
      (rule) => rule.selector.includes("[data-disabled]") && rule.selector.includes(":hover"),
    );

    expect(both).toBeDefined();
    expect(both!.conditions).toBe(2);
  });

  it("пересечение перечисляет вариации ОДНИМ уровнем скобок", () => {
    const compound = rules().rules.find((rule) => rule.origin === 2)!;

    expect(compound.selector).toContain('[data-variant="опасная"]');
    expect(compound.selector).not.toContain(":is(:is(");
  });
});

describe("порядок правил", () => {
  it("не убывает: сперва число состояний, затем происхождение", () => {
    const keys = rules().rules.map((rule) => rule.conditions * 10 + rule.origin);

    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });

  it("состояние встаёт ПОЗЖЕ вариации: наведение показывается и у опасной кнопки", () => {
    const list = rules().rules;
    const variant = list.findIndex((rule) => rule.selector.includes('[data-variant="опасная"]'));
    const hover = list.findIndex(
      (rule) => rule.conditions === 1 && rule.origin === 0 && rule.selector.includes(":hover"),
    );

    expect(hover).toBeGreaterThan(variant);
  });

  it("пересечение встаёт последним СРЕДИ СВОЕГО уровня условий, а не в конце файла", () => {
    // Правило с двумя состояниями стоит позже пересечения с одним, и это верно: условий у него
    // больше. Пересечение побеждает только тех, с кем спорит по весу.
    const list = rules().rules;
    const compound = list.find((rule) => rule.origin === 2)!;
    const sameLevel = list.filter((rule) => rule.conditions === compound.conditions);

    expect(sameLevel.at(-1)).toBe(compound);
    expect(list.indexOf(compound)).toBeLessThan(list.length - 1);
  });
});

describe("предок — вторая половина адреса", () => {
  const skin: Skin = {
    name: "предки",
    recipes: {
      field: {
        base: {
          control: {
            props: { color: "black" },
            ancestors: [
              {
                component: "field",
                part: "root",
                states: ["disabled"],
                style: { props: { color: "grey" }, states: { hover: { props: { color: "grey" } } } },
              },
            ],
          },
        },
      },
    },
  };

  it("правило предка адресует владельца слева, а часть — справа", () => {
    const rule = skinRules(skin, lookup).rules.find((r) => r.selector.includes(" "))!;
    const owner = partSelector(fieldPassport, "root")!;
    const own = partSelector(fieldPassport, "control")!;

    expect(rule.selector).toBe(`${owner}[data-disabled] ${own}`);
  });

  it("состояние предка считается условием — правило встаёт позже безусловного", () => {
    const list = skinRules(skin, lookup).rules;

    expect(list[0]!.conditions).toBe(0);
    expect(list.at(-1)!.conditions).toBe(2);
  });

  it("несуществующий предок — именованный отказ, а не тихий пропуск", () => {
    const broken: Skin = {
      name: "битый",
      recipes: {
        field: {
          base: {
            control: {
              ancestors: [
                { component: "нету", part: "root", style: { props: { color: "black" } } },
              ],
            },
          },
        },
      },
    };

    expect(names(broken)).toEqual(["unknown-ancestor"]);
  });
});

describe("именованные отказы", () => {
  it("компонент без паспорта", () => {
    expect(checkSkin(buttonSkin, emptyLookup, vocabulary).map((f) => f.name)).toEqual([
      "unknown-component",
    ]);
  });

  it("часть, которой компонент не объявлял", () => {
    expect(
      names({ name: "п", recipes: { button: { base: { нету: { props: { color: "red" } } } } } }),
    ).toEqual(["unknown-part"]);
  });

  it("состояние, которого часть не объявляла", () => {
    expect(
      names({
        name: "п",
        recipes: { button: { base: { root: { states: { выдумано: { props: { color: "red" } } } } } } },
      }),
    ).toEqual(["unknown-state"]);
  });

  it("вариации есть, умолчания нет", () => {
    expect(
      names({
        name: "п",
        recipes: { button: { variants: { тихая: { root: { props: { color: "red" } } } } } },
      }),
    ).toEqual(["default-missing"]);
  });

  it("умолчание называет вариацию, которой в рецепте нет", () => {
    expect(
      names({
        name: "п",
        recipes: {
          button: {
            variants: { тихая: { root: { props: { color: "red" } } } },
            defaultVariant: "нету",
          },
        },
      }),
    ).toEqual(["unknown-variant"]);
  });

  it("пересечение называет вариацию, которой в рецепте нет", () => {
    expect(
      names({
        name: "п",
        recipes: {
          button: {
            variants: { тихая: { root: { props: { color: "red" } } } },
            defaultVariant: "тихая",
            compoundVariants: [{ variants: ["нету"], style: { root: { props: { color: "red" } } } }],
          },
        },
      }),
    ).toEqual(["unknown-variant"]);
  });

  it("имя, непригодное внутрь селектора", () => {
    expect(
      names({
        name: 'вот"так',
        recipes: {},
      }),
    ).toEqual(["unsafe-name"]);
  });

  it("свободный вложенный селектор — от него и уходили", () => {
    expect(
      names({
        name: "п",
        recipes: {
          button: { base: { root: { props: { "& .подпись": { color: "red" } } } } },
        },
      }),
    ).toEqual(["free-selector"]);
  });

  it("псевдоэлемент и at-правило свободным селектором НЕ считаются", () => {
    expect(
      names({
        name: "п",
        recipes: {
          button: {
            base: {
              root: {
                props: {
                  "&::before": { content: '""' },
                  "@media (min-width: 40rem)": { color: "red" },
                },
              },
            },
          },
        },
      }),
    ).toEqual([]);
  });

  it("все изъяны отдаются сразу, а не по одному за проход", () => {
    const flaws = names({
      name: "п",
      recipes: {
        button: { base: { нету: { props: { color: "red" } }, root: { states: { ой: {} } } } },
      },
    });

    expect(flaws).toEqual(["unknown-part", "unknown-state"]);
  });
});

describe("пустое правило в вывод не едет", () => {
  it("часть без свойств правила не порождает", () => {
    const list = skinRules(
      { name: "п", recipes: { button: { base: { root: {} } } } },
      lookup,
    ).rules;

    expect(list).toEqual([]);
  });
});
