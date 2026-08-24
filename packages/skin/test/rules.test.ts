// СБОРКА РЕЦЕПТА — база, вариации, умолчание, пересечения — и порядок, в котором они встают.
//
// Порядок проверяется здесь, а не в порождении: он принадлежит сборке. Порождение только
// печатает то, что ему дали, и подменить неверный порядок печатью нельзя.

import { describe, expect, it } from "vitest";

import { partSelector } from "../src/address.js";
import type { LocalStyle, PartStyle, PartStyles, Skin } from "../src/model.js";
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

describe("вариация живёт на КОРНЕ, а не на каждой части (`PWEB-103`)", () => {
  // Ось вариаций объявляет КОМПОНЕНТ (`variantAxis`), одна на него целиком, и на узлах её несёт
  // корень: имя пишет потребитель, и пишет он его там, где ставит компонент. На вложенных частях
  // этого атрибута не бывает физически — их ставит кит, а кит про вариацию не знает.
  //
  // Прежде селектор вариации приклеивался к каждой части, и совпадало это с правдой ровно на
  // корне. Для остальных рождалось МЁРТВОЕ правило: адрес требовал атрибут, которого на узле нет,
  // и молчали об этом все — правило есть, вид не приезжает (`SKINED-5`, п. 2).

  /** Рецепт пробного поля: одна вариация, вид на корне и на вложенной части. */
  function поле(control: PartStyle, root: PartStyle = { props: { color: "blue" } }): Skin {
    return {
      name: "п",
      recipes: {
        field: {
          base: { control: { props: { color: "red" } } },
          variants: { крупное: { root, control } },
          defaultVariant: "крупное",
        },
      },
    };
  }

  /** Селекторы правил вариации — в порядке порождения. */
  function адреса(skin: Skin): string[] {
    return skinRules(skin).rules.filter((rule) => rule.origin > 0).map((rule) => rule.selector);
  }

  it("на НЕ-корневой части адрес идёт через КОРЕНЬ, а не через свой атрибут", () => {
    const [, вложенная] = адреса(поле({ props: { color: "green" } }));

    // Предок слева, своя часть справа — ровно та форма, которой уже возится состояние владельца.
    expect(вложенная).toContain('[data-part="root"]');
    expect(вложенная).toContain('[data-variant="крупное"]');
    expect(вложенная).toMatch(/\) \[data-scope="field"\]\[data-part="control"\]$/u);
    // Мёртвого адреса больше нет: на самой части атрибута вариации не требуется.
    expect(вложенная).not.toMatch(/\[data-part="control"\][^ ]*\[data-variant/u);
  });

  it("на КОРНЕ не изменилось ничего: там признак и живёт", () => {
    const [корневая] = адреса(поле({ props: { color: "green" } }));

    expect(корневая).toBe(
      '[data-scope="field"][data-part="root"]:is([data-variant="крупное"], :not([data-variant]))',
    );
  });

  it("ВЕС не растёт: условие поставила механика, и каскад от этого не сдвигается", () => {
    // `:where()` — потому что автор предка не писал. Без него правило вариации на вложенной части
    // весило бы пять доводов против трёх у правила состояния той же части и перебивало бы его,
    // хотя порядком распоряжается механика, а не вес.
    const [, вложенная] = адреса(поле({ props: { color: "green" } }));

    expect(вложенная.startsWith(":where(")).toBe(true);
  });

  it("вариация НЕ ТЕРЯЕТСЯ, когда у правила есть объявленный предок", () => {
    // Префикс накапливается, а не заменяется. Подмени его правило по предку — вариация исчезла бы
    // из адреса молча, и правило встало бы на все вариации сразу.
    const [, поПредку] = адреса(
      поле({
        ancestors: [
          {
            component: "field",
            part: "root",
            states: ["invalid"],
            style: { props: { color: "pink" } },
          },
        ],
      }),
    );

    expect(поПредку).toContain('[data-variant="крупное"]');
    expect(поПредку).toContain("[data-invalid]");
    expect(поПредку.indexOf("data-variant")).toBeLessThan(поПредку.indexOf("data-invalid"));
  });

  it("ПЕРЕСЕЧЕНИЕ идёт тем же путём — второго разрешения адреса нет", () => {
    const skin: Skin = {
      name: "п",
      recipes: {
        field: {
          base: { control: { props: { color: "red" } } },
          variants: { крупное: { root: { props: { color: "blue" } } } },
          defaultVariant: "крупное",
          compoundVariants: [
            { variants: ["крупное"], style: { control: { props: { color: "gray" } } } },
          ],
        },
      },
    };
    const [пересечение] = skinRules(skin).rules.filter((rule) => rule.origin === 2);

    expect(пересечение!.selector.startsWith(":where(")).toBe(true);
    expect(пересечение!.selector).toContain('[data-part="root"]');
  });

  it("корня нет в анатомии — `unknown-ancestor`, без нового имени изъяна ради случая", () => {
    // Причина та же, что у объявленного предка: узла, на котором живёт признак, у компонента нет.
    // Значит и ответ тот же — своего имени этот случай не заводит.
    const безКорня = withPassports((component) =>
      component === "field" ? { ...fieldPassport, root: "нетакой" } : lookup(component),
    );
    const flaws = безКорня.checkSkin(поле({ props: { color: "green" } }));

    expect(flaws.map((flaw) => flaw.name)).toContain("unknown-ancestor");
    expect(flaws[0]!.means).toContain("вариаци");
  });

  it("БАЗА не трогается вовсе: без вариации предок в адрес не приезжает", () => {
    const [база] = skinRules(поле({ props: { color: "green" } })).rules;

    expect(база!.selector).toBe('[data-scope="field"][data-part="control"]');
  });
});

describe("настройка адресуется ТЕМ ЖЕ путём, что вариация (`PWEB-103`)", () => {
  // Материал живой: гармошка объявляет `orientation` вместе с её местом в разметке
  // (`mark: data-orientation`, `PWEB-104`), а `multiple` и `collapsible` — без места: они меняют
  // поведение и следа не оставляют. Обе половины нужны, и обе проверяются здесь.

  /** Рецепт гармошки, одевающий названную часть при горизонтальном положении. */
  function положение(part: string, style: PartStyles[string] = { props: { color: "red" } }): Skin {
    return {
      name: "п",
      recipes: {
        accordion: { settings: { orientation: { horizontal: { [part]: style } } } },
      },
    };
  }

  it("на КОРНЕ — свой признак, без предка: там настройка и видна", () => {
    const [правило] = skinRules(положение("root")).rules;

    expect(правило!.selector).toBe(
      '[data-scope="accordion"][data-part="root"][data-orientation="horizontal"]',
    );
  });

  it("на ВЛОЖЕННОЙ части — через корень, тем же префиксом, что у вариации", () => {
    // Тот же код и то же размещение: паспорт объявляет настройку у КОМПОНЕНТА, значит признак
    // несёт его узел. Что Zag дублирует атрибут на все части — приятный факт, но полагаться на
    // него значило бы гадать о чужой разметке.
    const [правило] = skinRules(положение("item")).rules;

    expect(правило!.selector).toBe(
      ':where([data-scope="accordion"][data-part="root"][data-orientation="horizontal"]) ' +
        '[data-scope="accordion"][data-part="item"]',
    );
  });

  it("условие уезжает в АДРЕС правила, а не только в селектор", () => {
    // Читателям адреса (покрытие, читаемость) нужно знать, что вид условный: иначе счёт сложит
    // горизонтальный вид с вертикальным и посчитает пару, которой не бывает.
    const [правило] = skinRules(положение("root")).rules;

    expect(правило!.coordinate.settings).toEqual({ orientation: "horizontal" });
    expect(правило!.coordinate.variants).toEqual([]);
  });

  it("состояния и предок поверх настройки складываются, а не спорят", () => {
    const list = skinRules(
      положение("itemContent", {
        states: { closed: { props: { color: "blue" } } },
        ancestors: [
          {
            component: "accordion",
            part: "item",
            states: ["open"],
            style: { props: { color: "green" } },
          },
        ],
      }),
    ).rules;

    for (const правило of list) {
      expect(правило.selector).toContain('[data-orientation="horizontal"]');
    }
    expect(list.at(-1)!.selector).toContain("[data-state=\"open\"]");
  });

  it("настройки такой у компонента НЕТ — `unknown-setting`", () => {
    const flaws = checkSkin({
      name: "п",
      recipes: { accordion: { settings: { нетакой: { да: { root: { props: { color: "red" } } } } } } },
    });

    expect(flaws.map((flaw) => flaw.name)).toEqual(["unknown-setting"]);
    expect(flaws[0]!.means).toContain("нетакой");
  });

  it("значения такого настройка НЕ ПРИНИМАЕТ — тот же изъян, другое место", () => {
    const flaws = checkSkin(положение("root")).length;
    const кривое = checkSkin({
      name: "п",
      recipes: {
        accordion: { settings: { orientation: { наискосок: { root: { props: { color: "red" } } } } } },
      },
    });

    // Контроль рядом: на объявленном значении изъянов ноль, значит краснота ниже не случайна.
    expect(flaws).toBe(0);
    expect(кривое.map((flaw) => flaw.name)).toEqual(["unknown-setting"]);
    expect(кривое[0]!.means).toContain("vertical");
  });

  it("МЕСТА У НАСТРОЙКИ НЕТ — `setting-unaddressable`, и это законный случай", () => {
    // `multiple` меняет поведение и следа в разметке не оставляет. Прежде такое правило молча
    // порождалось бы и не вставало никуда — ровно тот класс мёртвых правил, который чинится.
    const flaws = checkSkin({
      name: "п",
      recipes: {
        accordion: { settings: { multiple: { true: { root: { props: { color: "red" } } } } } },
      },
    });

    expect(flaws.map((flaw) => flaw.name)).toEqual(["setting-unaddressable"]);
    expect(flaws[0]!.means).toContain("поведение");
  });

  it("МЁРТВЫХ ПРАВИЛ не остаётся: изъян есть — правила нет", () => {
    // Вторая половина того же: механика не только называет причину, но и не отдаёт адрес, по
    // которому вид не приедет.
    const { rules } = skinRules({
      name: "п",
      recipes: {
        accordion: { settings: { multiple: { true: { root: { props: { color: "red" } } } } } },
      },
    });

    expect(rules).toEqual([]);
  });
});

describe("ссылку в кадрах судят ПО МЕСТУ ПРИМЕНЕНИЯ (`PWEB-101`)", () => {
  // Материал ЖИВОЙ и он же тот, ради которого граница сдвинута: `--height` объявляет паспорт на
  // содержимом гармошки, кит кладёт её туда же, и раскрытие пишется движением по тому же узлу.
  // Прежде механика судила блок кадров САМ ПО СЕБЕ и отвечала «объявлена на другой части» — то
  // есть спрашивала про элемент, которого в блоке нет вовсе.

  /** Скин, применяющий движение на названной части гармошки. */
  function применённое(...parts: string[]): Skin {
    return {
      name: "п",
      keyframes: {
        раскрытие: { from: { height: "0" }, to: { height: "var(--height)" } },
      },
      recipes: {
        accordion: {
          base: Object.fromEntries(
            parts.map((part) => [part, { props: { animation: "раскрытие 320ms ease-out" } }]),
          ),
        },
      },
    };
  }

  it("на части, ОБЪЯВИВШЕЙ переменную, — законно", () => {
    expect(names(применённое("itemContent"))).toEqual([]);
  });

  it("на части БЕЗ неё — изъян, и названы в нём ДВИЖЕНИЕ и ЧАСТЬ", () => {
    const [flaw, ...остальные] = checkSkin(применённое("itemTrigger"));

    expect(остальные).toEqual([]);
    expect(flaw!.name).toBe("variable-elsewhere");
    expect(flaw!.where).toBe("keyframes.раскрытие.to.height");
    // Виноватые оба: без части человек не знает, куда переносить `animation:`, без движения — в
    // какой блок кадров смотреть.
    expect(flaw!.means).toContain("«раскрытие»");
    expect(flaw!.means).toContain("accordion.itemTrigger");
    expect(flaw!.means).toContain("accordion.itemContent");
  });

  it("применено на НЕСКОЛЬКИХ — законно там, где законно у каждой", () => {
    const flaws = checkSkin(применённое("itemContent", "itemTrigger"));

    // Ровно один: законная часть не утягивает за собой незаконную, а незаконная — законную.
    expect(flaws).toHaveLength(1);
    expect(flaws[0]!.means).toContain("accordion.itemTrigger");
    expect(flaws[0]!.means).not.toContain("accordion.itemContent»");
  });

  it("МУТАЦИЯ: `PWEB-93` не ослаблена — не применённое движение судится прежним словарём", () => {
    // Тот же блок кадров и та же одетая часть, но `animation:` не написан нигде: узла у движения
    // нет, и разрешиться на странице могли бы только имена корня. Пройди он здесь зелёным —
    // правило «переменная законна на своей части» обходилось бы записью движения, которое просто
    // не применили.
    const [flaw] = checkSkin({
      ...применённое("itemContent"),
      recipes: { accordion: { base: { itemContent: { props: { color: "red" } } } } },
    });

    expect(flaw?.name).toBe("variable-elsewhere");
    expect(flaw?.means).toContain("не применено ни одним правилом");
  });

  it("имени нет ни у кого — тот же суд, другое имя изъяна", () => {
    const skin = применённое("itemContent");
    const [flaw] = checkSkin({
      ...skin,
      keyframes: { раскрытие: { to: { height: "var(--нет-такого)" } } },
    });

    expect(flaw?.name).toBe("unknown-value");
    expect(flaw?.means).toContain("«раскрытие»");
    expect(flaw?.means).toContain("accordion.itemContent");
  });

  it("применением считают `animation` и `animation-name`, а не всё семейство", () => {
    // `animation-timeline` называет ШКАЛУ, а не движение. Спроси мы семейство целиком —
    // совпадение имён выдумало бы применение там, где его нет, и человек чинил бы правило,
    // которое ничего не применяет.
    const длиннотой = применённое();
    const место = (props: Record<string, string>): Skin => ({
      ...длиннотой,
      recipes: { accordion: { base: { itemContent: { props } } } },
    });

    expect(names(место({ animationName: "раскрытие" }))).toEqual([]);
    expect(names(место({ animationTimeline: "раскрытие" }))).toEqual(["variable-elsewhere"]);
  });

  it("ФОРМА движения судится РАЗ, сколько бы мест ни было", () => {
    // Пустая ступень остаётся пустой на любой части: повтори мы этот изъян по числу мест — человек
    // получил бы один дефект в двух экземплярах и пошёл бы искать второй.
    const flaws = checkSkin({
      ...применённое("itemContent", "itemTrigger"),
      keyframes: { раскрытие: { to: { height: "  " } } },
    });

    expect(flaws.filter((flaw) => flaw.name === "empty-value")).toHaveLength(1);
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
