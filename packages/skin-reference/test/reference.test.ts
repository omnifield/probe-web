// ЭТАЛОН ПРОХОДИТ МЕХАНИКУ ЦЕЛИКОМ — то, ради чего он и существует.
//
// Механика до сих пор проверялась по частям и на фикстурах: каждая проба брала ровно тот вход,
// который ей нужен. Здесь одна НАСТОЯЩАЯ запись идёт весь путь — семена, обе половины, рецепты
// пяти компонентов, порождение, — и проходит его без послаблений.
//
// Материал берётся у КИТА, а не собирается пробой: паспорта настоящие, и адреса порождаются из
// их анатомии. Собери проба паспорт сама — она проверяла бы наше представление о ките.

import {
  withPassports,
  SCALE_ROLES,
  skinValues,
} from "@omnifield/probe-web-skin";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { DRESSED, referenceForms, referenceOutfit, referencePalette } from "../src/index.js";
import { assemble, generateSkinCss, собранный, части } from "./assembled.js";

const referenceSkin = собранный.skin;

const { checkOutfit, checkSkin } = withPassports(passportOf);
const css = generateSkinCss(собранный.skin);

/** Объявления `--имя` из текста: имя → все его значения, в порядке появления. */
function declared(text: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  postcss.parse(text).walkDecls(/^--/, (decl) => {
    found.set(decl.prop, [...(found.get(decl.prop) ?? []), decl.value]);
  });
  return found;
}

describe("эталон объявлен ТРЕМЯ ЗАПИСЯМИ, а не листом", () => {
  it("палитра, формы и наряд — записи, а не текст стилей", () => {
    // Проверяется форма поставки, а не намерение: отгрузи мы лист — фреймворк снова одевал бы
    // сбоку, просто под другим именем.
    expect(typeof referencePalette).toBe("object");
    expect(referenceForms).toHaveLength(DRESSED.length);
    expect(referenceOutfit.forms).toEqual(referenceForms.map((form) => form.name));
  });

  it("наряд ССЫЛАЕТСЯ на палитру именем, а не копирует её", () => {
    // Копия дала бы вчерашний слепок: пересеяли палитру, а наряд остался прежним — молча.
    expect(referenceOutfit.palette).toBe(referencePalette.name);
    expect(JSON.stringify(referenceOutfit)).not.toContain("oklch");
  });

  it("палитра закрывает словарь, а формы просят только его роли — до надевания", () => {
    expect(checkOutfit(referenceOutfit, части)).toEqual([]);
  });

  it("РАСКРЫТИЕ ПИШЕТ СКИН — именованным движением по своему признаку (`PWEB-98`)", () => {
    // Вторая сторона объявления (`PWEB-93`). Кит меряет узел и кладёт `--height` на содержимое,
    // объявив это паспортом; анимации он не привозит — её пишет скин. Взять высоту больше
    // неоткуда: `auto` не анимируется, а придумать число за чужое содержимое нельзя.
    //
    // Мера теперь стоит в КАДРАХ, а не в правиле, и это предмет пробы: правило по надёжному
    // предку клало высоту и в покое, где кит держит меру нулём, — раздел, открытый изначально,
    // схлопывался. Ступень же разрешается на анимируемом узле и только пока движение идёт.
    const гармошка = referenceForms.find((form) => form.component === "accordion")!;

    expect(JSON.stringify(гармошка.keyframes)).toContain("var(--height)");
    expect(JSON.stringify(гармошка.recipe)).not.toContain("var(--height)");

    // И применено оно на СОДЕРЖИМОМ — том узле, куда кит кладёт меру. Применённое на соседе, оно
    // было бы законным по форме и мёртвым по делу.
    const содержимое = гармошка.recipe.base?.["itemContent"];

    expect(содержимое?.states?.["open"]?.props?.["animation"]).toContain("раскрытие");
    expect(содержимое?.states?.["closed"]?.props?.["animation"]).toContain("закрытие");
  });

  it("ПРОСЬБУ ДВИГАТЬ ПОМЕНЬШЕ движение не теряет: у обоих есть своя оговорка", () => {
    // Переход её имел с самого начала, и при переезде на кадры её легко было бы обронить — тише
    // всего теряется то, что уже работало.
    const гармошка = referenceForms.find((form) => form.component === "accordion")!;
    const содержимое = гармошка.recipe.base?.["itemContent"];
    const тише = "@media (prefers-reduced-motion: reduce)";

    for (const состояние of ["open", "closed"] as const) {
      expect(содержимое?.states?.[состояние]?.props?.[тише]).toEqual({ animation: "none" });
    }
  });

  it("МУТАЦИЯ: убери переменную из паспорта — форма гармошки краснеет с именем и частью", () => {
    // Паспорт приезжает ДОВОДОМ, и мутируется довод — копии чужой зоны для этого не нужно.
    // Проверка наряда получает паспорта тем же способом, что и порождение, и это здесь видно:
    // подмена на входе доезжает до изъяна.
    const безВысоты = (component: string) => {
      const passport = passportOf(component);
      if (!passport || component !== "accordion") return passport;

      return {
        ...passport,
        parts: passport.parts.map((часть) =>
          часть.name === "itemContent" ? { ...часть, variables: [] } : часть,
        ),
      };
    };

    // Контроль стоит выше: на настоящих паспортах изъянов ноль — значит краснота ниже не случайна.
    const flaws = withPassports(безВысоты).checkOutfit(referenceOutfit, части);

    expect(flaws.map((flaw) => flaw.name)).toContain("outside-vocabulary");
    expect(flaws[0]?.means).toContain("height");
    // Место в записи — блок кадров, а виноватые названы в тексте: движение вместе с частью, на
    // которой оно применено (`PWEB-101`). Без части человек не знает, куда переносить
    // `animation:`, без движения — какой блок смотреть.
    expect(flaws[0]?.where).toContain("keyframes.раскрытие");
    expect(flaws[0]?.means).toContain("«раскрытие»");
    expect(flaws[0]?.means).toContain("itemContent");
  });

  it("сборка отдаёт отчёт: одеты все пятеро, точечных правок ноль", () => {
    // Ноль правок — лучшее, что счёт может показать: правка это признание, что палитра
    // компоненту не подошла, а у эталона все пятеро одеты одной.
    expect(собранный.report.dressed).toEqual([...DRESSED]);
    expect(собранный.report.overrides).toBe(0);
  });

  it("собранный вид — тот же `Skin`, что и раньше: он остался формой СБОРКИ", () => {
    expect(referenceSkin.variables).toBeDefined();
    expect(Object.keys(referenceSkin.recipes).toSorted()).toEqual([...DRESSED]);
  });

  it("одеты все пятеро, у кого есть паспорт", () => {
    for (const component of DRESSED) expect(passportOf(component)).toBeDefined();
    expect(DRESSED).toEqual(["accordion", "button", "flow", "grid", "surface"]);
  });
});

describe("порождение проходит без изъянов", () => {
  it("механика не нашла в записи ни одного изъяна", () => {
    expect(checkSkin(referenceSkin)).toEqual([]);
  });

  it("текст порождается и разбирается парсером", () => {
    expect(() => postcss.parse(css)).not.toThrow();
    expect(css.length).toBeGreaterThan(0);
  });

  it("адреса собраны из анатомии: ни одного правила мимо координаты", () => {
    // Кроме блоков значений на корне — они и есть переменные, а не вид компонента.
    postcss.parse(css).walkRules((rule) => {
      if (rule.selector.startsWith(":root")) return;
      if (rule.parent?.type === "atrule" && (rule.parent as { name: string }).name === "keyframes") {
        return;
      }
      expect(rule.selector).toMatch(/\[data-scope="[a-z]+"\]\[data-part="/u);
    });
  });
});

describe("ОБЕ ПОЛОВИНЫ СТРОЯТСЯ ИЗ СЕМЯН — это проба, а не заявление", () => {
  /** Значения половины, выросшие из семени, — с именем шкалы и ступенью. */
  const посеяно = (half: "light" | "dark"): string[] =>
    [...skinValues(referenceSkin, half)]
      .filter(([, value]) => value.from === "seed")
      .map(([name]) => name);

  it("в каждой половине посеяны ступени ВСЕХ ролей-шкал словаря", () => {
    // Перечень спрашивается у МЕХАНИКИ, а не выписан здесь. Прежде он был выписан, и когда
    // словарь вырос с трёх ролей до пяти (`PWEB-79`), проба осталась зелёной: она проверяла свой
    // вчерашний список, а не сегодняшний контракт. Второй список чужого перечня разъезжается
    // молча — и разъехался.
    for (const half of ["light", "dark"] as const) {
      const names = посеяно(half);

      for (const scale of SCALE_ROLES) {
        expect(names, `${half}: шкала «${scale}»`).toContain(`${scale}-9`);
        expect(names, `${half}: контрастная «${scale}»`).toContain(`${scale}-contrast`);
      }
    }
  });

  it("палитра закрывает словарь РОЛЯМИ, а не тем, что употребили формы", () => {
    // Пять шкал при трёх употреблённых — законно и намеренно: словарь общий на всех поставщиков,
    // и палитра, задавшая только использованное здесь, развалилась бы на первой же чужой форме.
    const текст = JSON.stringify(referenceForms);
    const употреблено = SCALE_ROLES.filter((роль) => текст.includes(`var(--${роль}-`));

    expect(употреблено.length).toBeLessThan(SCALE_ROLES.length);
    expect(употреблено).toContain("акцент");
    expect(checkOutfit(referenceOutfit, части)).toEqual([]);
  });

  it("ни один цвет не выписан литералом — иначе скин перестал бы быть пересеваемым", () => {
    // МУТАЦИЯ ЗАДАЧИ: выпиши лестницу литералами — краснеет здесь. Пересеваемость и есть то,
    // ради чего человек садится в редактор: поменял семя — поменялся весь вид, обе половины.
    for (const half of ["light", "dark"] as const) {
      const литералы = [...skinValues(referenceSkin, half)].filter(
        ([name, value]) => value.from === "literal" && /-(?:\d{1,2}|contrast)$/u.test(name),
      );

      expect(литералы.map(([name]) => name), `${half}: ступени литералами`).toEqual([]);
    }
  });

  it("половины РАЗНЫЕ: тёмная выведена под свой режим, а не инверсией светлой", () => {
    const light = skinValues(referenceSkin, "light");
    const dark = skinValues(referenceSkin, "dark");
    const разошлись = [...light].filter(([name, own]) => dark.get(name)?.value !== own.value);

    expect(разошлись.length).toBeGreaterThan(20);
  });

  it("пересев меняет ВЕСЬ вид: другое семя — другие значения обеих половин", () => {
    // Пересев идёт через ПАЛИТРУ, а не через собранный вид: наряд ссылается именем, значит
    // достаточно подменить запись палитры — и весь вид следует за ней.
    const пересеян = assemble(referenceOutfit, {
      ...части,
      palettes: [{ ...referencePalette, scales: { ...referencePalette.scales, акцент: "oklch(0.55 0.2 140)" } }],
    }).skin;

    for (const half of ["light", "dark"] as const) {
      expect(skinValues(пересеян, half).get("акцент-9")?.value).not.toBe(
        skinValues(referenceSkin, half).get("акцент-9")?.value,
      );
    }
  });
});

describe("порождённый файл называет свою половину", () => {
  it("светлая названа всегда, тёмная — раз она есть", () => {
    const режим: string[] = [];
    postcss.parse(css).walkDecls("color-scheme", (decl) => {
      режим.push(decl.value);
    });

    expect(режим).toEqual(["light", "dark"]);
  });

  it("ряды, ушедшие из общего листа, приехали со скином", () => {
    const names = declared(css);

    for (const name of ["--motion-fast", "--ease-out", "--leading-normal", "--weight-medium"]) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it("размерные ступени тоже: лестница построена от семян эталона", () => {
    const names = declared(css);

    expect(names.has("--space")).toBe(true);
    expect(names.get("--space-3")?.[0]).toBe("calc(var(--space) * 3 * var(--density))");
  });

  it("порога нормы среди значений НЕТ — он не вкус, и скин его не объявляет", () => {
    // `--control-target-min` вёз общий лист. Объяви его скин — скин смог бы его «поправить», то
    // есть подвинуть норму записью вида. Разбор — в шапке `variables.ts`.
    expect(declared(css).has("--control-target-min")).toBe(false);
  });
});
