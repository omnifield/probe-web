// СЕМЕНА — второй способ объявить значения, и всё, что из него следует.
//
// Главная проверка здесь одна и она не про удобство: скин обязан быть ПЕРЕСЕВАЕМЫМ. Поменял
// семя — поменялся весь вид, обе половины, а правила остались как были. Проверяется сменой
// семени, а не рассуждением.

import { CONTRAST_PROMISES, contrastRatio } from "@omnifield/probe-web-style/values";
import postcss from "postcss";
import { describe, expect, it } from "vitest";

import { skinContrast } from "../src/contrast.js";
import { generateSkinCss } from "../src/generate.js";
import type { Skin } from "../src/model.js";
import { checkSkin } from "../src/rules.js";
import { NOT_SEEDED, skinValues, valueNames } from "../src/seeds.js";
import { buttonPassport, lookup } from "./passports.js";

const SEED = "oklch(0.28 0.006 285)";
const OTHER = "oklch(0.55 0.21 27)";

/** Скин на семени: правило адресует СТУПЕНЬ, а не значение. */
function sown(seed: string, extra?: Partial<Skin["variables"]>): Skin {
  return {
    name: "посев",
    variables: { scales: { бренд: seed }, ...extra },
    recipes: {
      button: {
        base: {
          root: {
            props: {
              color: "var(--бренд-contrast)",
              backgroundColor: "var(--бренд-9)",
              borderColor: "var(--бренд-8)",
            },
          },
        },
      },
    },
  };
}

/** Значения одного блока порождённого файла: имя без `--` → значение. */
function block(css: string, selector: string): Map<string, string> {
  const values = new Map<string, string>();

  postcss.parse(css).walkRules((rule) => {
    if (rule.selector !== selector) return;
    rule.walkDecls((decl) => {
      values.set(decl.prop.replace(/^--/, ""), decl.value);
    });
  });

  return values;
}

const LIGHT = ":root";
const DARK = ":root.dark, :root .dark";

describe("обе половины строятся", () => {
  const css = generateSkinCss(sown(SEED), lookup);

  it("светлая половина несёт все ступени шкалы и контрастную", () => {
    const light = block(css, LIGHT);

    for (const step of [1, 5, 9, 12]) expect(light.has(`бренд-${step}`)).toBe(true);
    expect(light.has("бренд-contrast")).toBe(true);
  });

  it("тёмная строится, а не пишется человеком — и отличается от светлой", () => {
    const light = block(css, LIGHT);
    const dark = block(css, DARK);

    expect(dark.size).toBeGreaterThan(0);
    expect(dark.get("бренд-1")).not.toBe(light.get("бренд-1"));
    expect(dark.get("бренд-12")).not.toBe(light.get("бренд-12"));
  });

  it("тёмная — не инверсия светлой: своя лестница", () => {
    const light = block(css, LIGHT);
    const dark = block(css, DARK);
    // Сравниваем ТОЛЬКО числовые ступени: будь тёмная зеркалом, ступень N в ней равнялась бы
    // ступени 13−N светлой. Проба нарочно узкая — на `contrast` она была бы пустой всегда.
    const mirrored = [1, 2, 3, 9, 11, 12].filter(
      (step) => dark.get(`бренд-${step}`) === light.get(`бренд-${13 - step}`),
    );

    expect(mirrored).toEqual([]);
  });

  it("объявленные ряды приезжают, необъявленные — нет", () => {
    const rich = generateSkinCss(
      { ...sown(SEED), variables: { scales: { бренд: { seed: SEED, alpha: true, scrim: true } } } },
      lookup,
    );
    const light = block(rich, LIGHT);

    expect(light.has("бренд-a3")).toBe(true);
    expect(light.has("бренд-scrim")).toBe(true);
    expect(block(css, LIGHT).has("бренд-a3")).toBe(false);
  });

  it("затемнение под слоем от режима не зависит — в тёмный блок оно не едет", () => {
    const rich = generateSkinCss(
      { ...sown(SEED), variables: { scales: { бренд: { seed: SEED, scrim: true } } } },
      lookup,
    );

    expect(block(rich, LIGHT).has("бренд-scrim")).toBe(true);
    expect(block(rich, DARK).has("бренд-scrim")).toBe(false);
  });
});

describe("скин пересеваем: правило следует за семенем", () => {
  const first = generateSkinCss(sown(SEED), lookup);
  const second = generateSkinCss(sown(OTHER), lookup);

  /** Правила без блоков значений — то, что описывает вид. */
  function ruleTexts(css: string): string[] {
    const found: string[] = [];
    postcss.parse(css).walkRules((rule) => {
      if (!rule.selector.startsWith(":root")) found.push(rule.toString());
    });
    return found;
  }

  it("правила не изменились ни на символ", () => {
    expect(ruleTexts(second)).toEqual(ruleTexts(first));
  });

  it("а значения — изменились, и в обеих половинах", () => {
    expect(block(second, LIGHT).get("бренд-9")).not.toBe(block(first, LIGHT).get("бренд-9"));
    expect(block(second, DARK).get("бренд-1")).not.toBe(block(first, DARK).get("бренд-1"));
  });

  it("правило, написанное ЛИТЕРАЛОМ, за семенем не следует — и это не дефект", () => {
    // Второе молчание, названное вслух: пересеваемость — свойство адреса, а не скина. Правило,
    // в котором стоит значение, а не ступень, останется прежним при любом семени.
    const literal = (seed: string): Skin => ({
      name: "литерал",
      variables: { scales: { бренд: seed } },
      recipes: {
        button: { base: { root: { props: { backgroundColor: "#334455" } } } },
      },
    });

    const before = generateSkinCss(literal(SEED), lookup);
    const after = generateSkinCss(literal(OTHER), lookup);

    expect(ruleTexts(after)).toEqual(ruleTexts(before));
    expect(after).toContain("#334455");
    // Значения при этом сменились — просто правило на них не смотрит.
    expect(block(after, LIGHT).get("бренд-9")).not.toBe(block(before, LIGHT).get("бренд-9"));
  });
});

describe("правка человека переживает перегенерацию и помечена", () => {
  const skin = sown(SEED, { dark: { "бренд-9": "#123456" } });

  it("правка тёмной половины уезжает в файл вместо построенного", () => {
    const css = generateSkinCss(skin, lookup);

    expect(block(css, DARK).get("бренд-9")).toBe("#123456");
  });

  it("светлая половина при этом остаётся построенной", () => {
    const css = generateSkinCss(skin, lookup);

    expect(block(css, LIGHT).get("бренд-9")).toBe(
      block(generateSkinCss(sown(SEED), lookup), LIGHT).get("бренд-9"),
    );
  });

  it("правка переживает СМЕНУ СЕМЕНИ — ради этого граница и названа", () => {
    const resown = generateSkinCss(sown(OTHER, { dark: { "бренд-9": "#123456" } }), lookup);

    expect(block(resown, DARK).get("бренд-9")).toBe("#123456");
    // Остальные ступени тёмной при этом пересеялись.
    expect(block(resown, DARK).get("бренд-8")).not.toBe(
      block(generateSkinCss(skin, lookup), DARK).get("бренд-8"),
    );
  });

  it("правка ПОМЕЧЕНА: механика говорит, откуда взялось каждое значение", () => {
    const dark = skinValues(skin, "dark");

    expect(dark.get("бренд-9")).toMatchObject({ from: "literal", value: "#123456" });
    expect(dark.get("бренд-8")).toMatchObject({ from: "seed", scale: "бренд", step: "8" });
  });

  it("правка СВЕТЛОЙ половины тёмную не уводит", () => {
    const only = sown(SEED, { light: { "бренд-9": "#abcdef" } });

    expect(skinValues(only, "light").get("бренд-9")).toMatchObject({ from: "literal" });
    expect(skinValues(only, "dark").get("бренд-9")).toMatchObject({ from: "seed" });
  });
});

describe("пути смешиваются — первое молчание, названное вслух", () => {
  const mixed: Skin = {
    name: "смесь",
    variables: {
      scales: { бренд: SEED },
      light: { своё: "#101010" },
      dark: { своё: "#f0f0f0" },
    },
    recipes: {
      button: {
        base: { root: { props: { color: "var(--своё)", backgroundColor: "var(--бренд-1)" } } },
      },
    },
  };

  it("одна шкала семенем, другое значение литералом — законно", () => {
    expect(checkSkin(mixed, lookup)).toEqual([]);
  });

  it("оба вида значений едут в файл", () => {
    const css = generateSkinCss(mixed, lookup);

    expect(block(css, LIGHT).get("своё")).toBe("#101010");
    expect(block(css, LIGHT).has("бренд-1")).toBe(true);
  });

  it("литерал без семени действует в обеих половинах, как и раньше", () => {
    expect(skinValues(mixed, "dark").get("своё")).toMatchObject({
      from: "literal",
      value: "#f0f0f0",
    });
  });
});

describe("ссылка на ступень известна проверке", () => {
  it("`var(--бренд-9)` изъяном не считается", () => {
    expect(checkSkin(sown(SEED), lookup)).toEqual([]);
  });

  it("ступень, которой шкала не даёт, — по-прежнему изъян", () => {
    const typo: Skin = {
      name: "опечатка",
      variables: { scales: { бренд: SEED } },
      recipes: {
        button: { base: { root: { props: { color: "var(--бренд-13)" } } } },
      },
    };

    expect(checkSkin(typo, lookup).map((flaw) => flaw.name)).toEqual(["unknown-value"]);
  });

  it("необъявленный ряд тоже изъян: `alpha` не просили — имён нет", () => {
    const noAlpha: Skin = {
      name: "без-альфы",
      variables: { scales: { бренд: SEED } },
      recipes: {
        button: { base: { root: { props: { backgroundColor: "var(--бренд-a3)" } } } },
      },
    };

    expect(noAlpha && checkSkin(noAlpha, lookup).map((flaw) => flaw.name)).toEqual([
      "unknown-value",
    ]);
  });

  it("перечень имён — обе половины разом", () => {
    const names = valueNames(sown(SEED, { dark: { "только-ночью": "#000000" } }));

    expect(names.has("бренд-9")).toBe(true);
    expect(names.has("только-ночью")).toBe(true);
  });
});

describe("негодное семя — изъян записи, а не поломка счёта", () => {
  const rotten: Skin = {
    name: "негодное",
    variables: { scales: { бренд: "не-цвет" } },
    recipes: {
      button: { base: { root: { props: { color: "var(--бренд-12)" } } } },
    },
  };

  it("проверка НЕ бросает, а называет причину", () => {
    // До `PWEB-45` построение шкалы бросало, и обещанный «перечень изъянов значением» падал
    // исключением посреди перечня.
    expect(() => checkSkin(rotten, lookup)).not.toThrow();
    expect(checkSkin(rotten, lookup).map((flaw) => flaw.name)).toEqual([
      "bad-seed",
      "unknown-value",
    ]);
  });

  it("причина названа первой: следом за ней сыплются ссылки на ступени", () => {
    const [first] = checkSkin(rotten, lookup);

    expect(first?.name).toBe("bad-seed");
    expect(first?.where).toBe("variables.scales.бренд");
    expect(first?.means).toContain("не-цвет");
  });

  it("порождение отказывает по-своему, а не чужим исключением", () => {
    expect(() => generateSkinCss(rotten, lookup)).toThrow(/не порождён/);
  });

  it("полупрозрачное семя названо полупрозрачным, а не опечаткой", () => {
    const translucent: Skin = {
      name: "полупрозрачное",
      variables: { scales: { бренд: "rgb(0 0 0 / 50%)" } },
      recipes: {},
    };
    const [flaw] = checkSkin(translucent, lookup);

    expect(flaw?.name).toBe("bad-seed");
    expect(flaw?.means).toContain("полупрозрач");
  });

  it("годные шкалы рядом с негодной строятся как ни в чём не бывало", () => {
    const mixed: Skin = {
      name: "смешанное",
      variables: { scales: { бренд: SEED, сор: "не-цвет" } },
      recipes: {},
    };

    expect(skinValues(mixed, "light").has("бренд-9")).toBe(true);
    expect(skinValues(mixed, "light").has("сор-9")).toBe(false);
  });
});

describe("контраст обещан построением", () => {
  // Замер 2026-08-21: 16 семян × 2 режима × все объявленные обещания — 384 пары, ни одного
  // нарушения. Проба держит это дальше: обещание, на которое опирается «читаемость избыточна»,
  // обязано проверяться машиной, а не помниться.
  const seeds = [SEED, OTHER, "#ff0000", "#ffffff", "#000000", "oklch(0.85 0.25 100)"];

  it("объявленные обещания держатся на шкалах, построенных из скина", () => {
    for (const seed of seeds) {
      for (const half of ["light", "dark"] as const) {
        const values = skinValues(sown(seed), half);
        const step = (key: string): string => values.get(`бренд-${key}`)!.value;

        for (const promise of CONTRAST_PROMISES) {
          for (const against of promise.against) {
            expect(contrastRatio(step(promise.step), step(against))).toBeGreaterThanOrEqual(
              promise.min,
            );
          }
        }
      }
    }
  });

  it("читаемость на семенном скине молчит — но НЕ снята", () => {
    // На пути семян проверка избыточна: обещание даётся построением. Снять её нельзя — на пути
    // литералов она единственное, что стоит между скином и нечитаемой кнопкой.
    expect(skinContrast(sown(SEED), [buttonPassport])).toEqual([]);
  });

  it("на пути литералов она по-прежнему ловит", () => {
    const bad: Skin = {
      name: "плохой",
      recipes: {
        button: {
          base: { root: { props: { color: "#b0b0b0", backgroundColor: "#ffffff" } } },
        },
      },
    };

    expect(skinContrast(bad, [buttonPassport]).length).toBeGreaterThan(0);
  });

  it("литерал, положенный ПОВЕРХ семени, проверяется как литерал", () => {
    // Наложение снимает обещание построения ровно на том значении, которое человек тронул, — и
    // проверка это видит.
    const spoiled = sown(SEED, { light: { "бренд-contrast": "#b0b0b0", "бренд-9": "#ffffff" } });
    const low = skinContrast(spoiled, [buttonPassport]).filter((note) => note.kind === "low");

    expect(low.length).toBeGreaterThan(0);
  });
});

describe("что не выводится — названо в поставке", () => {
  it("перечень объявлен данными, а не абзацем в доке", () => {
    expect(Object.keys(NOT_SEEDED).length).toBeGreaterThan(0);
    expect(Object.keys(NOT_SEEDED)).toContain("тени");
  });

  it("у каждой строки есть причина, а не только имя", () => {
    for (const why of Object.values(NOT_SEEDED)) expect(why.length).toBeGreaterThan(0);
  });
});
