// СБОРКА РЕЦЕПТА — база, вариации, умолчание, пересечения — и порядок, в котором они встают.
//
// Порядок проверяется здесь, а не в порождении: он принадлежит сборке. Порождение только
// печатает то, что ему дали, и подменить неверный порядок печатью нельзя.

import { describe, expect, it } from "vitest";

import { partSelector } from "../src/address.js";
import type { LocalStyle, Skin } from "../src/model.js";
import { withPassports } from "../src/bound.js";
import { buttonPassport, emptyLookup, fieldPassport, lookup } from "./passports.js";
import { buttonSkin } from "./skins.js";

// Источник паспортов называется ОДИН раз (`PWEB-94`): дальше он приезжает связкой.
const { checkSkin, skinRules } = withPassports(lookup);


/** Собирает правила пробного скина — вход, к которому сводится большинство проверок ниже. */
function rules(skin: Skin = buttonSkin) {
  return skinRules(skin);
}

/** Имена изъянов — сравнивать удобнее их, а пояснение читает человек. */
function names(skin: Skin) {
  return checkSkin(skin).map((flaw) => flaw.name);
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
    const rule = skinRules(skin).rules.find((r) => r.selector.includes(" "))!;
    const owner = partSelector(fieldPassport, "root")!;
    const own = partSelector(fieldPassport, "control")!;

    expect(rule.selector).toBe(`${owner}[data-disabled] ${own}`);
  });

  it("состояние предка считается условием — правило встаёт позже безусловного", () => {
    const list = skinRules(skin).rules;

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
    expect(withPassports(emptyLookup).checkSkin(buttonSkin).map((f) => f.name)).toEqual([
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

describe("ненадёжный признак: вид отвергается, движение остаётся (`PWEB-99`)", () => {
  // Материал ЖИВОЙ: у содержимого гармошки раскрытость объявлена вместе с оговоркой — признак
  // приезжает не всегда (`absentWhen`). Пометку читает `addressesView` владельца формы, и проба
  // проверяет именно тот случай, ради которого граница заведена.

  /** Рецепт, одевающий содержимое гармошки по его СОБСТВЕННОЙ раскрытости. */
  function поСвоему(style: LocalStyle): Skin {
    return {
      name: "п",
      recipes: { accordion: { base: { itemContent: { states: { open: style } } } } },
    };
  }

  it("вид по такому признаку — изъян", () => {
    expect(names(поСвоему({ props: { height: "var(--height)" } }))).toEqual([
      "view-unaddressable",
    ]);
  });

  it("ДВИЖЕНИЕ по нему законно: иначе анимации раскрытия не написать вовсе", () => {
    expect(names(поСвоему({ props: { animation: "раскрытие 200ms ease-out" } }))).toEqual([]);
  });

  it("адресовать состояние по-прежнему есть чем: правило порождается", () => {
    const list = skinRules(поСвоему({ props: { animation: "раскрытие 200ms" } })).rules;

    expect(list).toHaveLength(1);
    expect(list[0]!.selector).toContain('[data-state="open"]');
  });

  it("движение и вид в одном блоке — изъян, и назван в нём ВИД, а не движение", () => {
    const [flaw] = checkSkin(
      поСвоему({ props: { animation: "раскрытие 200ms", height: "var(--height)" } }),
    );

    expect(flaw!.name).toBe("view-unaddressable");
    expect(flaw!.where).toBe("recipes.accordion.base.itemContent.states.open.props");
    expect(flaw!.means).toContain("height");
    expect(flaw!.means).not.toContain("animation: ");
  });

  it("вид внутри at-правила прячется не лучше: условие меняет место, а не род", () => {
    expect(
      names(
        поСвоему({ props: { "@media (min-width: 40rem)": { height: "var(--height)" } } }),
      ),
    ).toEqual(["view-unaddressable"]);
  });

  it("семейство, а не перечень имён: длинноты движения проходят обе", () => {
    // `animationTimeline` и `transition-behavior` моложе исходных спецификаций. Выпиши мы имена
    // поимённо, автор скина получал бы изъян на законном CSS, а починка была бы у нас.
    expect(
      names(
        поСвоему({ props: { animationTimeline: "auto", "transition-behavior": "allow-discrete" } }),
      ),
    ).toEqual([]);
  });

  it("МУТАЦИЯ: надёжный признак ТОГО ЖЕ ИМЕНИ изъяном не становится", () => {
    // Раскрытость ПУНКТА объявлена без оговорки, и вид по ней законен. Решай проба по имени
    // состояния, а не по пометке — покраснело бы и это.
    expect(
      names({
        name: "п",
        recipes: {
          accordion: { base: { item: { states: { open: { props: { color: "red" } } } } } },
        },
      }),
    ).toEqual([]);
  });

  it("тот же признак у ПРЕДКА — тот же изъян: условие стоит слева и приезжает не всегда", () => {
    // Адрес здесь нарочно искусственный — содержимое пунктy не предок, — и предмет пробы не
    // одежда, а вторая половина адреса: разбери обход только свои состояния, то же самое правило
    // проходило бы зелёным, стоило написать его через предка.
    expect(
      names({
        name: "п",
        recipes: {
          accordion: {
            base: {
              itemIndicator: {
                ancestors: [
                  {
                    component: "accordion",
                    part: "itemContent",
                    states: ["open"],
                    style: { props: { color: "red" } },
                  },
                ],
              },
            },
          },
        },
      }),
    ).toEqual(["view-unaddressable"]);
  });

  it("правка образца читает состояния из того же паспорта — и получает тот же изъян", () => {
    const { checkSketch } = withPassports(lookup);

    expect(
      checkSketch([
        {
          node: "узел-1",
          component: "accordion",
          part: "itemContent",
          style: { states: { open: { props: { height: "var(--height)" } } } },
        },
      ]).map((flaw) => flaw.name),
    ).toEqual(["view-unaddressable"]);
  });
});

describe("пустое правило в вывод не едет", () => {
  it("часть без свойств правила не порождает", () => {
    const list = skinRules(
      { name: "п", recipes: { button: { base: { root: {} } } } },
    ).rules;

    expect(list).toEqual([]);
  });
});
