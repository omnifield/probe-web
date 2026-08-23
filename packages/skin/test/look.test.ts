// ВИД ДЕЛИТСЯ НА ТРИ (`PWEB-78`): палитра, форма, наряд — складываются при надевании.
//
// Здесь проверяется МОДЕЛЬ: что записи раздельны, что наряд ссылается, а не копирует, что словарь
// работает контрактом и что сборка отдаёт отчёт. Живой вид — граница точечной правки и порядок
// источников на настоящем узле — проверяется настоящим браузером в эталонном скине: слои `jsdom`
// игнорирует целиком, и спрашивать его про каскад бессмысленно.

import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { generateSkinCss } from "../src/generate.js";
import {
  assemble,
  checkOutfit,
  OutfitRefused,
  skinContrast,
  skinGaps,
  VOCABULARY,
  type LookParts,
} from "../src/index.js";
import { buttonPassport, lookup } from "./passports.js";
import {
  зелёная,
  кнопка,
  кнопкаПлоская,
  кнопкаСвоя,
  кнопкаЧужая,
  наряд,
  неполная,
  поверхность,
  синяя,
  слепая,
} from "./looks.js";

const части: LookParts = {
  palettes: [синяя, зелёная, неполная, слепая],
  forms: [кнопка, поверхность, кнопкаПлоская, кнопкаЧужая, кнопкаСвоя],
};

/** Объявления `--имя` из текста по селекторам: селектор → имя → значение. */
function блоки(css: string): Map<string, Map<string, string>> {
  const найдено = new Map<string, Map<string, string>>();

  postcss.parse(css).walkRules((rule) => {
    const пары = найдено.get(rule.selector) ?? new Map<string, string>();
    rule.walkDecls(/^--/, (decl) => {
      пары.set(decl.prop, decl.value);
    });
    if (пары.size > 0) найдено.set(rule.selector, пары);
  });

  return найдено;
}

describe("три записи существуют раздельно и складываются при надевании", () => {
  it("палитра и форма самостоятельны: ни одна не знает о другой", () => {
    // Палитра не упоминает компонентов, форма не несёт значений. Иначе делить было бы нечего.
    expect(JSON.stringify(синяя)).not.toContain("button");
    expect(JSON.stringify(кнопка)).not.toContain("oklch");
  });

  it("сборка даёт надеваемый вид — тот же `Skin`, что и раньше", () => {
    const { skin } = assemble(наряд, части);

    // `Skin` не снят: он перестал быть формой ЗАПИСИ и остался формой СБОРКИ. Порождение,
    // надевание, покрытие и читаемость принимают его ровно как принимали.
    expect(skin.name).toBe(наряд.name);
    expect(Object.keys(skin.recipes).toSorted()).toEqual(["button", "surface"]);
    expect(skin.variables?.scales).toEqual(синяя.scales);
    expect(() => generateSkinCss(skin, lookup)).not.toThrow();
  });

  it("на корень уезжает имя НАРЯДА — опознание одно", () => {
    expect(assemble(наряд, части).skin.name).toBe("проба");
  });
});

describe("наряд ССЫЛАЕТСЯ, а не копирует", () => {
  it("поменял палитру — поменялся собранный вид", () => {
    // Мутация задачи. Копия убила бы пересев: в наряде остался бы вчерашний слепок палитры, и
    // смена бренда перестала бы что-либо менять — молча.
    const наСиней = assemble(наряд, части).skin;
    const наЗелёной = assemble({ ...наряд, palette: "зелёная" }, части).skin;

    expect(наЗелёной.variables?.scales).not.toEqual(наСиней.variables?.scales);
    expect(generateSkinCss(наЗелёной, lookup)).not.toBe(generateSkinCss(наСиней, lookup));
  });

  it("в самом наряде значений нет вовсе — только имена", () => {
    expect(JSON.stringify(наряд)).not.toContain("oklch");
    expect(наряд.palette).toBe("синяя");
  });

  it("имя, которого источник не отдаёт, — изъян, а не пустой вид", () => {
    const flaws = checkOutfit({ ...наряд, palette: "которой нет" }, части);

    expect(flaws.map((flaw) => flaw.name)).toContain("unknown-palette");
  });
});

describe("СЛОВАРЬ работает контрактом", () => {
  it("форма с ролью вне словаря отвергается ДО надевания, с названной причиной", () => {
    const плохой = { ...наряд, forms: ["кнопка-чужая"] };

    expect(() => assemble(плохой, части)).toThrow(OutfitRefused);

    const flaw = checkOutfit(плохой, части).find((кандидат) => кандидат.name === "outside-vocabulary");

    expect(flaw?.where).toContain("фирменный-градиент");
    expect(flaw?.means).toContain("словаре нет");
  });

  it("палитра, не закрывшая словарь, названа неполной ДО надевания", () => {
    const flaws = checkOutfit({ ...наряд, palette: "неполная" }, части);
    const flaw = flaws.find((кандидат) => кандидат.name === "palette-incomplete");

    expect(flaw).toBeDefined();
    // Причина названа числом и именами, а не «что-то не так»: человек чинит запись, а не ищет.
    expect(flaw?.means).toContain("не задано");
    expect(flaw?.means).toContain("leading-none");
  });

  it("полная палитра словарь ЗАКРЫВАЕТ — иначе проба выше ничего не значила бы", () => {
    expect(checkOutfit(наряд, части)).toEqual([]);
    expect(VOCABULARY.length).toBeGreaterThan(100);
  });

  it("две формы на один компонент — изъян: чей вид победит, наряд не говорит", () => {
    const flaws = checkOutfit({ ...наряд, forms: ["кнопка-строгая", "кнопка-плоская"] }, части);

    expect(flaws.map((flaw) => flaw.name)).toContain("component-twice");
  });
});

describe("точечная правка живёт в границах своего компонента", () => {
  const css = generateSkinCss(assemble(наряд, части).skin, lookup);
  const адрес = Object.entries(buttonPassport.anatomy.build().root!.attrs).find(
    ([, value]) => value === "button",
  )!;

  it("правка объявлена на координате КОМПОНЕНТА, а не части и не узла", () => {
    const селектор = `[${адрес[0]}="${адрес[1]}"]`;

    expect(блоки(css).get(селектор)?.get("--radius-md")).toBe("0px");
  });

  it("и НЕ объявлена больше нигде: за пределами компонента роль остаётся палитриной", () => {
    // Второй конец той же пробы. Роль переобъявлена ровно на одном адресе — значит соседний
    // компонент её не видит: объявление на другом узле ему попросту не видно.
    const где = [...блоки(css)].filter(([, пары]) => пары.has("--radius-md")).map(([селектор]) => селектор);

    expect(где).toHaveLength(2);
    expect(где).toContain(`[${адрес[0]}="${адрес[1]}"]`);
    // Второй адрес — корень: там роль задала палитра, и правка её не стёрла.
    expect(где).toContain(":root");
  });

  it("счёт правок отдаётся ЗНАЧЕНИЕМ, и по компонентам тоже", () => {
    // Сорок исключений означают, что палитра выбрана неверно. Механика сообщает, а не запрещает:
    // что делать с числом, решает человек. Сорок у одного и сорок у сорока — разные болезни,
    // поэтому рядом с суммой стоит разбивка.
    const { report } = assemble(наряд, части);

    expect(report.overrides).toBe(1);
    expect(report.overridesBy).toEqual({ button: 1 });
  });

  it("правка с ролью вне словаря отвергается: переопределять нечего", () => {
    const flaws = checkOutfit({ ...наряд, overrides: { button: { "чего-нет": "0" } } }, части);

    expect(flaws.map((flaw) => flaw.name)).toContain("outside-vocabulary");
  });
});

describe("НЕПОЛНЫЙ НАРЯД законен", () => {
  it("наряд без единой формы собирается и надевается", () => {
    // То же правило, что «нет скина — нет визуала», только на один компонент.
    const голый = assemble({ ...наряд, forms: [], overrides: {} }, части);

    expect(голый.report.dressed).toEqual([]);
    expect(() => generateSkinCss(голый.skin, lookup)).not.toThrow();
  });

  it("компонент без формы остаётся голым — и покрытие это ГОВОРИТ ЦЕЛЫМ компонентом", () => {
    const одета = assemble({ ...наряд, forms: ["кнопка-строгая"], overrides: {} }, части);
    const голая = assemble({ ...наряд, forms: [], overrides: {} }, части);

    // У одетой кнопки пробелы есть — форма покрыла базу, а не все состояния, — но это ЧАСТИ и
    // СОСТОЯНИЯ. У неодетой пробел другого рода: компонента нет вовсе.
    expect(skinGaps(одета.skin, [buttonPassport]).some((gap) => gap.kind === "component")).toBe(false);
    expect(
      skinGaps(голая.skin, [buttonPassport])
        .filter((gap) => gap.kind === "component")
        .map((gap) => gap.component),
    ).toEqual(["button"]);
  });
});

describe("порядок источников значения объявлен и проверяем", () => {
  it("форма бьёт палитру: своё значение в правиле палитра не достаёт", () => {
    // Правило написало `0px` литералом — роль скругления до этого свойства не доходит вовсе.
    const css = generateSkinCss(
      assemble({ ...наряд, forms: ["кнопка-своя"], overrides: {} }, части).skin,
      lookup,
    );
    const правило = postcss
      .parse(css)
      .nodes.flatMap((node) => (node.type === "atrule" ? node.nodes ?? [] : []))
      .find((node) => node.type === "rule" && node.selector.includes('data-part="root"'));

    expect(правило?.toString()).toContain("border-radius: 0px");
    expect(правило?.toString()).not.toContain("border-radius: var(--radius-md)");
  });

  it("правка бьёт форму: роль, которую форма адресует, переопределена у компонента", () => {
    const css = generateSkinCss(assemble(наряд, части).skin, lookup);

    // Форма просит `var(--radius-md)`; правка задаёт эту роль на координате компонента, то есть
    // ближе к узлу, чем корень. Что победит на живом узле — предмет пробы в настоящем браузере.
    expect(css).toContain("border-radius: var(--radius-md)");
    expect(блоки(css).get('[data-scope="button"]')?.get("--radius-md")).toBe("0px");
  });
});

describe("читаемость и покрытие считаются ПО СОБРАННОМУ наряду", () => {
  it("ТА ЖЕ форма на другой палитре становится нечитаемой", () => {
    // Вот ради чего сборка объявлена шагом с отчётом: контраст перестал быть свойством части.
    // Форма написана под одну палитру, а лечь может на другую — и тогда читаемость становится
    // свойством СОЧЕТАНИЯ. Спросить её у формы или у палитры по отдельности нельзя: у формы нет
    // значений, а палитра не знает, что на что легло.
    const хорошее = skinContrast(assemble(наряд, части).skin, [buttonPassport]);
    const плохое = skinContrast(assemble({ ...наряд, palette: "слепая" }, части).skin, [buttonPassport]);

    expect(хорошее.notes.filter((note) => note.kind === "low")).toEqual([]);
    expect(плохое.notes.filter((note) => note.kind === "low").length).toBeGreaterThan(0);
  });

  it("считать их у части нечем: у формы значений нет вовсе", () => {
    expect(кнопка.recipe.base?.root?.props?.background).toBe("var(--акцент-9)");
    expect(JSON.stringify(кнопка)).not.toContain("oklch");
  });
});
