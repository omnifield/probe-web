// ПЕРЕМЕННЫЕ ПАСПОРТА — вторая сторона объявления (`PWEB-93`).
//
// Кит объявил переменные части вместе с тем, кто их ставит. Одна сторона этого уже была: паспорт
// СКАЗАЛ. Вторая — механика ей ВЕРИТ: правило, просящее объявленную переменную, проезжает, а не
// отвергается «неизвестным именем». Без второй стороны объявление было бы текстом для человека, а
// анимация раскрытия не писалась бы вовсе.
//
// Здесь же проверяется главное ограничение: законна переменная НА СВОЕЙ ЧАСТИ. На соседней её
// никто не ставит, и правило приехало бы на страницу с неразрешимым значением — ровно то, от чего
// уходим, только тише.

import { describe, expect, it } from "vitest";

import {
  checkOutfit,
  knownRole,
  ROLE_NAMES,
  type Form,
  type LookParts,
  type Skin,
} from "../src/index.js";
import { checkSkin } from "../src/rules.js";
import { fieldPassport, lookup } from "./passports.js";
import { наряд, части } from "./looks.js";

/** Скин из одного правила: часть просит имя. */
function скин(component: string, part: string, value: string): Skin {
  return { name: "проба", recipes: { [component]: { base: { [part]: { props: { height: value } } } } } };
}

/** Наряд из одной формы — та же запись, что и в скине, но проверенная ДО сборки. */
function наряды(form: Form): [typeof наряд, LookParts] {
  return [
    { ...наряд, forms: [form.name], overrides: {} },
    { ...части, forms: [...части.forms, form] },
  ];
}

/** Форма из одного правила: часть просит имя. */
function форма(component: string, part: string, value: string): Form {
  return {
    name: "проба-переменной",
    component,
    recipe: { base: { [part]: { props: { height: value } } } },
  };
}

/** Изъяны наряда, собранного вокруг одной формы. */
function изъяны(form: Form) {
  return checkOutfit(...наряды(form), lookup);
}

/** Паспорт БЕЗ объявленной переменной — тот же во всём остальном. */
function безПеременной(component: string, part: string) {
  return (искомый: string) => {
    const passport = lookup(искомый);
    if (!passport || искомый !== component) return passport;

    return {
      ...passport,
      parts: passport.parts.map((кандидат) =>
        кандидат.name === part ? { ...кандидат, variables: [] } : кандидат,
      ),
    };
  };
}

describe("объявленная переменная законна НА СВОЕЙ ЧАСТИ", () => {
  it("правило проезжает обеими дверями — и порождением, и нарядом", () => {
    // Живая гармошка: `--height` объявлен на содержимом, `setBy: kit`. Кит меряет узел и кладёт
    // его туда сам — значит переменная наблюдаема, значит скин вправе её адресовать.
    expect(checkSkin(скин("accordion", "itemContent", "var(--height)"), lookup)).toEqual([]);
    expect(изъяны(форма("accordion", "itemContent", "var(--height)"))).toEqual([]);
  });

  it("роли она при этом НЕ становится: в словаре её нет и быть не должно", () => {
    // Разделение несущее. Роль задаёт палитра, а измеренную высоту палитра задать не может: её
    // ставит кит на живом узле. Смешай мы их — палитра получила бы обещание, которого не выполнит.
    expect(knownRole("height")).toBe(false);
    expect(ROLE_NAMES).not.toContain("height");
  });

  it("`setBy: consumer` законна ТАК ЖЕ: различие в риске, а не в праве", () => {
    // Живой кит объявляет только свои переменные — второй случай проверяется на паспорте пробы.
    // Скин, написанный в расчёте на потребителя, у забывчивого потребителя молча не сработает; но
    // это его выбор, а не наша граница: запрети мы такие правила, паспорт объявлял бы то, чем
    // нельзя пользоваться.
    const своя = форма(fieldPassport.component, "label", "var(--label-width)");

    expect(изъяны(своя)).toEqual([]);
    expect(checkSkin(скин(fieldPassport.component, "label", "var(--label-width)"), lookup)).toEqual([]);
  });
});

describe("на ЧУЖОЙ части — изъян, и причина названа", () => {
  it("сказано, что имя объявлено, и сказано ГДЕ", () => {
    const [flaw] = изъяны(форма("accordion", "itemTrigger", "var(--height)"));

    expect(flaw?.name).toBe("variable-elsewhere");
    expect(flaw?.means).toContain("--height");
    expect(flaw?.means).toContain("accordion.itemContent");
    expect(flaw?.where).toContain("itemTrigger");
  });

  it("обе двери отвечают одно — и обе называют дом", () => {
    const [flaw] = checkSkin(скин("accordion", "itemTrigger", "var(--height)"), lookup);

    expect(flaw?.name).toBe("variable-elsewhere");
    expect(flaw?.means).toContain("accordion.itemContent");
  });

  it("это НЕ то же имя, что «такого имени нет»: причины разные и починки разные", () => {
    // «Объявлено, но не здесь» чинят переносом правила на ту часть либо адресом по предку;
    // «нет вовсе» — объявлением в палитре или в паспорте. Слейся они в один изъян, человек,
    // поставивший правило не на ту часть, пошёл бы дописывать роль в палитру.
    const чужая = изъяны(форма("accordion", "itemTrigger", "var(--height)"));
    const небывалая = изъяны(форма("accordion", "itemTrigger", "var(--чего-нет)"));

    expect(чужая[0]?.name).not.toBe(небывалая[0]?.name);
    expect(небывалая[0]?.name).toBe("outside-vocabulary");
    expect(небывалая[0]?.means).toContain("ни в словаре, ни в паспорте");
  });

  it("`setBy` на это не влияет: у переменной потребителя граница та же", () => {
    const [flaw] = изъяны(форма(fieldPassport.component, "control", "var(--label-width)"));

    expect(flaw?.name).toBe("variable-elsewhere");
    expect(flaw?.means).toContain(`${fieldPassport.component}.label`);
  });
});

describe("паспорта приходят ТЕМ ЖЕ способом, что в порождении", () => {
  it("подмени паспорт на входе — краснеют ОБЕ двери, значит путь один", () => {
    // Настоящая проба на единственность пути. Заведись у проверки наряда свой источник паспортов
    // — «взять из кита напрямую», «спросить PASSPORTS» — подмена на входе оставила бы её зелёной,
    // и мы узнали бы об этом на первом же ките, приехавшем не из этой сборки.
    //
    // Копии чужой зоны для этого не нужно: паспорт приезжает ДОВОДОМ, и мутируется довод.
    const слепой = безПеременной("accordion", "itemContent");
    const правило = "var(--height)";

    // Контроль: на настоящих паспортах обе двери молчат — иначе краснота ниже ничего не значит.
    expect(checkSkin(скин("accordion", "itemContent", правило), lookup)).toEqual([]);
    expect(изъяны(форма("accordion", "itemContent", правило))).toEqual([]);

    expect(checkSkin(скин("accordion", "itemContent", правило), слепой)[0]?.name).toBe("unknown-value");
    expect(checkOutfit(...наряды(форма("accordion", "itemContent", правило)), слепой)[0]?.name).toBe(
      "outside-vocabulary",
    );
  });
});
