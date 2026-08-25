// ВИД ДЕЛИТСЯ НА ТРИ (`PWEB-78`): палитра, форма, наряд — складываются при надевании.
//
// Здесь проверяется МОДЕЛЬ: что записи раздельны, что наряд ссылается, а не копирует, что словарь
// работает контрактом и что сборка отдаёт отчёт. Живой вид — граница точечной правки и порядок
// источников на настоящем узле — проверяется настоящим браузером в эталонном скине: слои `jsdom`
// игнорирует целиком, и спрашивать его про каскад бессмысленно.

import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { withPassports } from "../src/generate.js";
import {
  knownRole,
  OutfitRefused,
  SCALE_ROLES,
  skinContrast,
  skinGaps,
  skinValues,
  VOCABULARY,
} from "../src/index.js";
import { buttonPassport, lookup } from "./passports.js";
import { гармошкаДвижением, кнопка, наряд, синяя, части } from "./looks.js";

// Источник паспортов называется ОДИН раз (`PWEB-94`): дальше он приезжает связкой.
const { assemble, checkOutfit, checkSkin, generateSkinCss } = withPassports(lookup);

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
    expect(() => generateSkinCss(skin)).not.toThrow();
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
    expect(generateSkinCss(наЗелёной)).not.toBe(generateSkinCss(наСиней));
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
    expect(flaw?.means).toContain("ни в словаре, ни в паспорте");
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

  it("ЦВЕТОВЫХ НАМЕРЕНИЙ ПЯТЬ, и словарь по-прежнему ВЫВОДИТСЯ из перечня ролей", () => {
    // Перечень один, и всё остальное из него выводится: выпиши мы роли вторым списком — он
    // разъехался бы с первым на первой же новой роли, и правым оказался бы тот, кого спросили
    // последним. Проба спрашивает СЛОВАРЬ о том, что объявил перечень, а не наоборот.
    expect(SCALE_ROLES).toEqual(["акцент", "нейтраль", "опасность", "успех", "предупреждение"]);

    for (const роль of SCALE_ROLES) {
      expect(knownRole(`${роль}-9`), роль).toBe(true);
      expect(knownRole(`${роль}-contrast`), роль).toBe(true);
    }

    // Информации в перечне нет намеренно: синее намерение почти всегда совпадает с акцентом, и
    // шестая шкала придёт фактом, а не заранее.
    expect(knownRole("информация-9")).toBe(false);
  });

  it("палитра ПОД ТРИ ШКАЛЫ отвергается до надевания — с названной причиной", () => {
    // Ломающее для палитр, и оно работает как задумано: неполнота НАЗЫВАЕТСЯ, а не
    // проглатывается. Причина несёт и число недостающих ролей, и их имена.
    const плохой = { ...наряд, palette: "трёхшкальная" };

    expect(() => assemble(плохой, части)).toThrow(OutfitRefused);

    const flaw = checkOutfit(плохой, части).find((кандидат) => кандидат.name === "palette-incomplete");

    // Недостача названа ПО СЕМЬЯМ: тринадцать ступеней непосеянной шкалы — одна недоделка, а не
    // тринадцать. Перечень имён подряд обрезался бы на первой же шкале, и человек починил бы одну,
    // не узнав о второй, — ровно это проба тут и поймала.
    expect(flaw?.means).toContain("успех (");
    expect(flaw?.means).toContain("предупреждение (");
  });

  it("две формы на один компонент — изъян: чей вид победит, наряд не говорит", () => {
    const flaws = checkOutfit({ ...наряд, forms: ["кнопка-строгая", "кнопка-плоская"] }, части);

    expect(flaws.map((flaw) => flaw.name)).toContain("component-twice");
  });
});

describe("ссылку в кадрах судят ПО МЕСТУ ПРИМЕНЕНИЯ — и до сборки тоже (`PWEB-101`)", () => {
  // Ответ обязан совпасть с тем, что даст порождение: разъедься они — одна и та же запись была бы
  // законной до надевания и незаконной после, и правым оказался бы тот, кого спросили последним.

  const сДвижением = { ...наряд, forms: ["гармошка-движением"] };

  it("движение на своей части проходит проверку наряда", () => {
    expect(checkOutfit(сДвижением, части)).toEqual([]);
  });

  it("и собирается: отказа больше нет там, где раскрытие иначе не написать", () => {
    // Прежде здесь стоял `OutfitRefused`, и это закрывало ЕДИНСТВЕННЫЙ путь: измеренную высоту
    // кит кладёт на содержимое, второго адреса у неё нет, а `auto` не анимируется.
    expect(() => assemble(сДвижением, части)).not.toThrow();
    expect(generateSkinCss(assemble(сДвижением, части).skin)).toContain("@keyframes раскрытие");
  });

  it("НЕ НА ТОЙ части — изъян, и названы в нём движение и часть", () => {
    const плохой = { ...наряд, forms: ["гармошка-не-там"] };
    const [flaw, ...остальные] = checkOutfit(плохой, части);

    expect(остальные).toEqual([]);
    expect(flaw?.name).toBe("variable-elsewhere");
    expect(flaw?.where).toContain("keyframes.раскрытие");
    expect(flaw?.means).toContain("«раскрытие»");
    expect(flaw?.means).toContain("itemTrigger");
    expect(() => assemble(плохой, части)).toThrow(OutfitRefused);
  });

  it("МУТАЦИЯ: сними применение — и та же запись снова краснеет", () => {
    // Проба самой границы: законность приезжает от `animation:`, а не от блока кадров. Не будь
    // места применения — судить было бы нечем, и старый ответ («объявлена на другой части»)
    // возвращается.
    const безПрименения = {
      ...гармошкаДвижением,
      name: "гармошка-без-применения",
      recipe: { base: { itemContent: { props: { overflow: "hidden" } } } },
    };
    const flaws = checkOutfit(
      { ...наряд, forms: [безПрименения.name] },
      { ...части, forms: [...части.forms, безПрименения] },
    );

    expect(flaws.map((flaw) => flaw.name)).toEqual(["variable-elsewhere"]);
  });

  it("движение под НАСТРОЙКОЙ проходит проверку так же, как в базе (`PWEB-105`)", () => {
    // Пробел нашёлся на настоящей записи: `settings` приехал в рецепт после того, как этот обход
    // уже существовал (`PWEB-103` следует за `PWEB-101`), и обходил только базу, вариации и
    // пересечения. Запись под настройкой была НЕПРОВЕРЕННОЙ — `assemble` отказывал причиной
    // «переменную не ставят», хотя на порождённом правиле она стояла ровно на своей части.
    const сНастройкой = { ...наряд, forms: ["гармошка-движением-в-настройке"] };

    expect(checkOutfit(сНастройкой, части)).toEqual([]);
    expect(() => assemble(сНастройкой, части)).not.toThrow();
    expect(generateSkinCss(assemble(сНастройкой, части).skin)).toContain("@keyframes раскрытие");
  });

  it("роль ВНЕ словаря под настройкой ловится так же, как в базе — вторая половина того же пробела", () => {
    // `formRefs` проверяет не только движение: та же слепая зона касалась и обычных ссылок.
    const плохой = { ...наряд, forms: ["гармошка-чужая-в-настройке"] };
    const flaw = checkOutfit(плохой, части).find((кандидат) => кандидат.name === "outside-vocabulary");

    expect(flaw?.where).toContain("settings.orientation.horizontal.root");
    expect(flaw?.where).toContain("фирменный-градиент");
  });
});

describe("паспорта нет вовсе — названа ПРИЧИНА, а не следствие (`PWEB-95`)", () => {
  it("форма на компонент без паспорта краснеет своим именем", () => {
    const flaws = checkOutfit({ ...наряд, forms: ["нездешняя"], overrides: {} }, части);

    expect(flaws.map((flaw) => flaw.name)).toEqual(["unknown-component"]);
    expect(flaws[0]?.where).toBe("forms[0]");
    // Человек по этому тексту идёт в КИТ, а не в палитру: чинится объявлением паспорта.
    expect(flaws[0]?.means).toContain("«нездешний»");
    expect(flaws[0]?.means).toContain("ките");
  });

  it("следствий не сыплется: ни одного изъяна по именам, которых без паспорта не прочитать", () => {
    // Второй конец той же пробы, и ровно та жалоба, ради которой задача заведена: раньше форма
    // отдавала по `outside-vocabulary` на каждую свою переменную — формально не ложь, но названа
    // не причина. Перечень выше пуст ровно потому, что перебор ссылок прекращён.
    const flaws = checkOutfit({ ...наряд, forms: ["нездешняя"], overrides: {} }, части);

    expect(flaws.filter((flaw) => flaw.name === "outside-vocabulary")).toEqual([]);
  });

  it("та же причина у ТОЧЕЧНОЙ ПРАВКИ: адрес ей собрать не из чего", () => {
    // Печать такую правку молча пропускает — селектор, собранный догадкой, попадал бы неизвестно
    // куда, — и ссылается на то, что изъян назовёт проверка наряда. До `PWEB-95` не называл никто.
    const flaws = checkOutfit(
      { ...наряд, forms: [], overrides: { нездешний: { "radius-md": "0px" } } },
      части,
    );

    expect(flaws.map((flaw) => flaw.name)).toEqual(["unknown-component"]);
    expect(flaws[0]?.where).toBe("overrides.нездешний");
  });

  it("ОБЕ ПОЛОВИНЫ механики отвечают на этот случай ОДНИМ именем", () => {
    // Ради этого имя и взято прежнее, а не заведён синоним: причина одна, починка одна — значит и
    // слово одно. Иначе редактор говорил бы человеку не то же, что печать.
    const наряду = checkOutfit({ ...наряд, forms: ["нездешняя"], overrides: {} }, части);
    const порождению = checkSkin({
      name: "проба",
      recipes: { нездешний: { base: { root: { props: { color: "var(--акцент-9)" } } } } },
    });

    expect(наряду.map((flaw) => flaw.name)).toEqual(порождению.map((flaw) => flaw.name));
    expect(порождению.map((flaw) => flaw.name)).toEqual(["unknown-component"]);
  });

  it("наряд без такой формы прежним не перестал быть: ложных изъянов нет", () => {
    expect(checkOutfit(наряд, части)).toEqual([]);
  });
});

describe("точечная правка живёт в границах своего компонента", () => {
  const css = generateSkinCss(assemble(наряд, части).skin);
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
    expect(() => generateSkinCss(голый.skin)).not.toThrow();
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
    );
    const правило = postcss
      .parse(css)
      .nodes.flatMap((node) => (node.type === "atrule" ? node.nodes ?? [] : []))
      .find((node) => node.type === "rule" && node.selector.includes('data-part="root"'));

    expect(правило?.toString()).toContain("border-radius: 0px");
    expect(правило?.toString()).not.toContain("border-radius: var(--radius-md)");
  });

  it("правка бьёт форму: роль, которую форма адресует, переопределена у компонента", () => {
    const css = generateSkinCss(assemble(наряд, части).skin);

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

describe("обещания контраста считаются по НОВЫМ шкалам так же, как по старым", () => {
  // Лестницу строит `buildScale` зоны значений, и ей всё равно, какое семя: обещания привязаны к
  // СТУПЕНИ, а не к шкале. Проба проверяет, что это так и на новых двух, — иначе «добавили роль»
  // означало бы «добавили роль без обещаний», а узнал бы об этом человек по нечитаемой плашке.
  const значения = skinValues(assemble(наряд, части).skin, "light");

  for (const роль of ["успех", "предупреждение"]) {
    it(`«${роль}»: ступени построены семенем, а не выписаны`, () => {
      for (const ступень of ["1", "9", "11", "12", "contrast"]) {
        expect(значения.get(`${роль}-${ступень}`)?.from, `${роль}-${ступень}`).toBe("seed");
      }
    });
  }

  it("и тёмная половина у новых шкал тоже СТРОИТСЯ, а не инвертируется", () => {
    const тёмные = skinValues(assemble(наряд, части).skin, "dark");

    for (const роль of ["успех", "предупреждение"]) {
      expect(тёмные.get(`${роль}-9`)?.value).not.toBe(значения.get(`${роль}-9`)?.value);
      expect(тёмные.get(`${роль}-9`)?.from).toBe("seed");
    }
  });
});
