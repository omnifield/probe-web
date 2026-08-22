// ЭТАЛОН ПРОХОДИТ МЕХАНИКУ ЦЕЛИКОМ — то, ради чего он и существует.
//
// Механика до сих пор проверялась по частям и на фикстурах: каждая проба брала ровно тот вход,
// который ей нужен. Здесь одна НАСТОЯЩАЯ запись идёт весь путь — семена, обе половины, рецепты
// пяти компонентов, порождение, — и проходит его без послаблений.
//
// Материал берётся у КИТА, а не собирается пробой: паспорта настоящие, и адреса порождаются из
// их анатомии. Собери проба паспорт сама — она проверяла бы наше представление о ките.

import { checkSkin, generateSkinCss, skinValues } from "@omnifield/probe-web-skin";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { DRESSED, referenceSkin } from "../src/index.js";

const css = generateSkinCss(referenceSkin, passportOf);

/** Объявления `--имя` из текста: имя → все его значения, в порядке появления. */
function declared(text: string): Map<string, string[]> {
  const found = new Map<string, string[]>();
  postcss.parse(text).walkDecls(/^--/, (decl) => {
    found.set(decl.prop, [...(found.get(decl.prop) ?? []), decl.value]);
  });
  return found;
}

describe("эталон объявлен СКИНОМ, а не листом", () => {
  it("это запись переменных и рецептов, а не текст стилей", () => {
    // Проверяется форма поставки, а не намерение: отгрузи мы лист — фреймворк снова одевал бы
    // сбоку, просто под другим именем.
    expect(typeof referenceSkin).toBe("object");
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
    expect(checkSkin(referenceSkin, passportOf)).toEqual([]);
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

  it("в каждой половине посеяны ступени всех трёх шкал", () => {
    for (const half of ["light", "dark"] as const) {
      const names = посеяно(half);

      for (const scale of ["бренд", "нейтраль", "опасность"]) {
        expect(names, `${half}: шкала «${scale}»`).toContain(`${scale}-9`);
        expect(names, `${half}: контрастная «${scale}»`).toContain(`${scale}-contrast`);
      }
    }
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
    const пересеян = {
      ...referenceSkin,
      variables: {
        ...referenceSkin.variables,
        scales: { ...referenceSkin.variables?.scales, бренд: "oklch(0.55 0.2 140)" },
      },
    };

    for (const half of ["light", "dark"] as const) {
      expect(skinValues(пересеян, half).get("бренд-9")?.value).not.toBe(
        skinValues(referenceSkin, half).get("бренд-9")?.value,
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
