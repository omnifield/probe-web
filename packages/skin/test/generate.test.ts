// ПОРОЖДЕНИЕ CSS: слой каскада, принудительный признак, машинный разрез, отказ на изъяне.
//
// Порождённый текст читается ПАРСЕРОМ (`postcss`, и он уже стоит зависимостью взятой утилиты),
// а не поиском подстроки. Поиск подстроки в CSS проходит и там, где правила на самом деле нет:
// в комментарии, в соседнем селекторе, в куске имени. Проба, которая так проверяет, зелёная
// всегда.

import postcss, { type Rule } from "postcss";
import { describe, expect, it } from "vitest";

import { generateSketchCss, generateSkinCss, SkinRefused } from "../src/generate.js";
import { FORCE_ATTRIBUTE, LAYER_ORDER, NODE_ATTRIBUTE, SKETCH_LAYER, SKIN_LAYER } from "../src/marks.js";
import type { SketchEdit, Skin } from "../src/model.js";
import { skinRules } from "../src/rules.js";
import { inLayer } from "./helpers/layers.js";
import { buttonPassport, lookup } from "./passports.js";
import { buttonSkin } from "./skins.js";

const skinCss = generateSkinCss(buttonSkin, lookup);

const edits: readonly SketchEdit[] = [
  {
    node: "btn-1",
    component: "button",
    part: "root",
    style: {
      props: { backgroundColor: "rgb(9, 9, 9)" },
      states: { hover: { props: { backgroundColor: "rgb(8, 8, 8)" } } },
    },
  },
];
const sketchCss = generateSketchCss(edits, lookup);

/**
 * Правила текста — с селекторами и телами, как их видит парсер.
 *
 * Ступени именованных движений (`from`, `to`, `50%`) парсер тоже считает правилами, но
 * селекторами они не являются: это отрезки времени. Их отсекаем, иначе любая проверка про адрес
 * спотыкается о слово `from`.
 */
function rulesOf(css: string): Rule[] {
  const found: Rule[] = [];
  postcss.parse(css).walkRules((rule) => {
    const owner = rule.parent;
    if (owner?.type === "atrule" && (owner as { name: string }).name === "keyframes") return;
    found.push(rule);
  });
  return found;
}

/** Слои, объявленные блоками. */
function layersOf(css: string): string[] {
  const found: string[] = [];
  postcss.parse(css).walkAtRules("layer", (at) => {
    if (at.nodes) found.push(at.params);
  });
  return found;
}

describe("текст разбирается и лежит в своём слое", () => {
  it("порождённый CSS — валидный текст, а не строка с фигурными скобками", () => {
    expect(() => postcss.parse(skinCss)).not.toThrow();
    expect(rulesOf(skinCss).length).toBeGreaterThan(0);
  });

  it("скин лежит в скиновом слое, правки образца — в своём", () => {
    expect(layersOf(skinCss)).toEqual([SKIN_LAYER]);
    expect(layersOf(sketchCss)).toEqual([SKETCH_LAYER]);
  });

  it("порядок слоёв объявлен в ОБОИХ текстах: подключить их могут по отдельности", () => {
    for (const css of [skinCss, sketchCss]) {
      expect(css).toContain(LAYER_ORDER);
    }
    expect(LAYER_ORDER.indexOf(SKIN_LAYER)).toBeLessThan(LAYER_ORDER.indexOf(SKETCH_LAYER));
  });

  it("вложенное развёрнуто в плоское: ни одного `&` не осталось", () => {
    for (const rule of rulesOf(skinCss)) {
      expect(rule.selector).not.toContain("&");
    }
  });

  it("псевдоэлемент и at-правило доехали, а не потерялись при развороте", () => {
    const skin: Skin = {
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
    };
    const css = generateSkinCss(skin, lookup);

    expect(rulesOf(css).some((rule) => rule.selector.endsWith("::before"))).toBe(true);
    expect(css).toContain("@media (min-width: 40rem)");
  });
});

describe("адрес порождён, а не написан", () => {
  it("каждое правило скина начинается с координаты из анатомии", () => {
    const attrs = buttonPassport.anatomy.build().root.attrs;
    const coordinate = Object.entries(attrs)
      .map(([name, value]) => `[${name}="${value}"]`)
      .join("");

    for (const rule of rulesOf(skinCss)) {
      if (rule.selector.startsWith(":root")) continue;
      expect(rule.selector).toContain(coordinate);
    }
  });
});

describe("принудительный признак — тот же генератор, а не второй", () => {
  /** Состояния кнопки, которые данными выставить нельзя вообще. */
  const pseudo = buttonPassport.parts[0]!.states.filter((state) => state.mark.kind === "pseudo");

  it("у кнопки такие состояния есть — иначе проверять нечего", () => {
    expect(pseudo.length).toBeGreaterThan(0);
  });

  it("правило, доступное псевдоклассом, доступно и признаком — и наоборот", () => {
    for (const state of pseudo) {
      const mark = state.mark.kind === "pseudo" ? state.mark.name : "";
      const forced = `[${FORCE_ATTRIBUTE}~="${state.name}"]`;

      for (const rule of rulesOf(skinCss)) {
        // Псевдокласс сравнивается по границе: `:focus-visible` содержит в себе `:focus`, и
        // поиск подстрокой поймал бы не то состояние.
        const hasPseudo = new RegExp(`${mark}(?![\\w-])`).test(rule.selector);

        expect(hasPseudo).toBe(rule.selector.includes(forced));
      }
    }
  });

  it("оба довода стоят в ОДНОМ правиле: тела не могут разойтись, их одно", () => {
    const hover = rulesOf(skinCss).filter((rule) => rule.selector.includes(":hover"));

    expect(hover.length).toBeGreaterThan(0);
    for (const rule of hover) {
      expect(rule.selector).toContain(`:is(:hover, [${FORCE_ATTRIBUTE}~="hover"])`);
    }
  });

  it("отдельных правил под предпросмотр не появилось: правил ровно столько, сколько собрано", () => {
    // Если бы принудительный признак приезжал ВТОРЫМ правилом — то есть если бы предпросмотр
    // порождал что-то своё, — правил в тексте оказалось бы больше собранных. Считаем.
    const built = skinRules(buttonSkin, lookup).rules.length;
    const printed = rulesOf(skinCss).filter((rule) => !rule.selector.startsWith(":root")).length;

    expect(printed).toBe(built);
  });

  it("состояние, выраженное атрибутом, пары НЕ получает — оно выставимо как есть", () => {
    const disabled = rulesOf(skinCss).filter((rule) => rule.selector.includes("[data-disabled]"));

    expect(disabled.length).toBeGreaterThan(0);
    for (const rule of disabled) {
      expect(rule.selector).not.toContain(`${FORCE_ATTRIBUTE}~="disabled"`);
    }
  });
});

describe("машинный разрез: генератор отдаёт ТОЛЬКО скиновую часть", () => {
  it("в файле скина нет ни одного адреса по имени узла", () => {
    for (const rule of rulesOf(skinCss)) {
      expect(rule.selector).not.toContain(NODE_ATTRIBUTE);
    }
  });

  it("в файле правок образца нет ни одного правила рецепта", () => {
    for (const rule of rulesOf(sketchCss)) {
      expect(rule.selector).toContain(`[${NODE_ATTRIBUTE}=`);
    }
  });

  it("разрез держится входом, а не отбором: скин на вход правок не приходит вовсе", () => {
    // Проверяем свойство, а не реализацию: правки, порождённые с ПУСТЫМ перечнем, дают текст
    // без единого правила — значит взяться правилам скина там неоткуда.
    expect(rulesOf(generateSketchCss([], lookup))).toEqual([]);
  });
});

describe("переменные и движения", () => {
  it("светлая половина встаёт на корень, тёмная — на класс режима", () => {
    // Отбираем блоки ПАРЫ по её содержимому, а не по позиции: на корне живёт ещё и размерный
    // набор, и он не половина — режим его не двигает (`PWEB-64`). Отбор по порядку сломался бы
    // от появления любого соседа рядом, ничего при этом не проверив.
    const halves = rulesOf(skinCss)
      .filter(inLayer)
      .filter((rule) => rule.nodes.some((node) => node.type === "decl" && node.prop === "--skin-ink"));

    expect(halves.map((rule) => rule.selector)).toEqual([":root", ":root.dark, :root .dark"]);
  });

  it("имя переменной уезжает с двумя дефисами, как записано в зоне значений", () => {
    const light = rulesOf(skinCss).find((rule) => inLayer(rule) && rule.selector === ":root")!;

    expect(light.toString()).toContain("--skin-ink:");
  });

  it("именованное движение объявлено один раз и целиком", () => {
    const frames: string[] = [];
    postcss.parse(skinCss).walkAtRules("keyframes", (at) => {
      frames.push(at.params);
    });

    expect(frames).toEqual(["пульс"]);
  });
});

describe("имя свойства", () => {
  it("верблюжье начертание уезжает в дефисное", () => {
    expect(skinCss).toContain("padding-inline:");
    expect(skinCss).not.toContain("paddingInline");
  });

  it("дефисное начертание не трогается", () => {
    const css = generateSkinCss(
      { name: "п", recipes: { button: { base: { root: { props: { "z-index": "1" } } } } } },
      lookup,
    );

    expect(css).toContain("z-index: 1;");
  });
});

describe("отказ", () => {
  it("скин с изъяном в текст НЕ превращается", () => {
    const broken: Skin = {
      name: "п",
      recipes: { button: { base: { root: { props: { color: "var(--нет-такого)" } } } } },
    };

    expect(() => generateSkinCss(broken, lookup)).toThrow(SkinRefused);
  });

  it("отказ несёт ВСЕ изъяны сразу — человек чинит запись целиком", () => {
    const broken: Skin = {
      name: "п",
      recipes: {
        button: {
          base: {
            нету: { props: { color: "red" } },
            root: { props: { color: "var(--нет-такого)" } },
          },
        },
      },
    };

    try {
      generateSkinCss(broken, lookup);
      expect.unreachable("порождение обязано было отказать");
    } catch (error) {
      expect(error).toBeInstanceOf(SkinRefused);
      expect((error as SkinRefused).flaws.map((f) => f.name)).toEqual([
        "unknown-part",
        "unknown-value",
      ]);
    }
  });

  it("правки образца с изъяном тоже отвергаются", () => {
    expect(() =>
      generateSketchCss(
        [{ node: "btn", component: "нету", part: "root", style: { props: { color: "red" } } }],
        lookup,
      ),
    ).toThrow(SkinRefused);
  });
});
