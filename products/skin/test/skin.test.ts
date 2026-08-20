// СКИН КНОПКИ как данные (`PWEB-31`, первая половина гейта).
//
// Проверяется не «CSS похож на правильный», а четыре обещания записи:
//
//   1. запись СОБИРАЕТСЯ генератором механики — то есть форма верна. Изъян записи механика
//      отвергает целиком, а не отдаёт текст с ошибкой рядом;
//   2. порождённый CSS адресует КООРДИНАТАМИ из анатомии — за это и цепляется скин;
//   3. в самой записи нет ни одного селектора: адрес приходит из паспорта, руками не пишется;
//   4. скин стоит на СВОИХ значениях: ни одного имени из нашего набора. Пока это не так, «скин
//      без наших значений законен» остаётся обещанием.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { generateSkinCss } from "@omnifield/probe-web-skin";
import { DARK_CLASS, FORCE_ATTRIBUTE, SKIN_LAYER } from "@omnifield/probe-web-skin/model";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { describe, expect, it } from "vitest";

import { GRAPHITE } from "../src/skins/graphite.js";
import { SEED } from "../src/skins/index.js";

/** Текст порождается один раз: он один и тот же для всех проверок ниже. */
const css = generateSkinCss(GRAPHITE, passportOf);

/**
 * Исходник записи — для проверок «чего в ней нет».
 *
 * Путь считается от корня зоны, а не от `import.meta.url`: порождение тянет за собой postcss, а
 * с ним в jsdom приезжает браузерная половина `node:url`, и адрес пробы перестаёт быть файловым.
 * Комментарии вырезаны — в них имена НАЗЫВАЮТСЯ (объяснить запрет, не назвав запрещённое,
 * нельзя), но ничего не адресуют.
 */
const source = readFileSync(resolve(process.cwd(), "src/skins/graphite.ts"), "utf8").replaceAll(
  /\/\/.*$/gm,
  "",
);

describe("запись собирается", () => {
  it("генератор принимает скин целиком", () => {
    expect(() => generateSkinCss(GRAPHITE, passportOf)).not.toThrow();
  });

  it("в коде зоны он — СЕМЯ, а не перечень", () => {
    // Семя одно и вывозится под своим именем: им засевают пустую службу командой. Локального
    // перечня скинов в зоне нет вовсе — два перечня расходятся молча, и это уже оплачено.
    expect(SEED).toBe(GRAPHITE);

    const index = readFileSync(resolve(process.cwd(), "src/skins/index.ts"), "utf8");

    expect(index).toContain("listSkins");
    expect(index).not.toMatch(/const SKINS|Record<string, Skin>/);
  });

  it("умолчание объявлено — вариации без него были бы двумя адресами", () => {
    const recipe = GRAPHITE.recipes.button;

    expect(recipe?.defaultVariant).toBeDefined();
    expect(Object.keys(recipe?.variants ?? {})).toContain(recipe?.defaultVariant ?? "");
  });
});

describe("порождённый CSS адресует координатами", () => {
  it("часть — парой атрибутов из анатомии", () => {
    expect(css).toContain('[data-scope="button"][data-part="root"]');
  });

  it("вариация — именем, которое объявил сам скин", () => {
    for (const name of Object.keys(GRAPHITE.recipes.button?.variants ?? {})) {
      expect(css).toContain(`[data-variant="${name}"]`);
    }
  });

  it("состояние кита — его атрибутом, состояние браузера — псевдоклассом с признаком", () => {
    expect(css).toContain("[data-disabled]");
    expect(css).toContain(":hover");
    expect(css).toContain(FORCE_ATTRIBUTE);
  });

  it("уезжает в свой слой каскада", () => {
    expect(css).toContain(`@layer ${SKIN_LAYER}`);
  });

  it("тёмная половина следует за режимом", () => {
    expect(css).toContain(DARK_CLASS);
    expect(css).toContain("--skin-ink");
  });
});

describe("чего в записи нет", () => {
  it("ни одного селектора", () => {
    expect(source).not.toMatch(/data-scope|data-part|data-variant|data-slot/);
    expect(source).not.toMatch(/:hover|:focus-visible|:active/);
  });

  it("ни одного имени из нашего набора значений", () => {
    // Наши роли и шкалы: `--brand-9`, `--space-4`, `--radius-md`, `--text-muted`…
    // Собственные переменные скина начинаются с `skin-`, и спутать их нельзя.
    const ours = [...source.matchAll(/var\(\s*--([a-z0-9-]+)/gu)].map((match) => match[1]);

    expect(ours.length).toBeGreaterThan(0);
    for (const name of ours) expect(name).toMatch(/^skin-/);
  });
});
