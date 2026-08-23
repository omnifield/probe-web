// СНИМОК ВЫВОДА — граница «текст не меняется», сделанная постоянной.
//
// ## Зачем снимок, когда есть разборные пробы
//
// Разборные пробы (`generate.test.ts`) проверяют УТВЕРЖДЕНИЯ: слой на месте, признак на месте,
// имени узла в скине нет. Они не заметят, что чужое средство разворота сменило форму вывода —
// переставило блоки, съело пустую строку, иначе развернуло at-правило. Заметить это можно только
// сравнением текста целиком, и сравнивать надо с тем, что уже уехало.
//
// Снимок лежит файлом рядом и коммитится: любая правка порождения показывается человеку
// ДИФФОМ на ревью, а не тишиной. Это и есть «до и после», сделанное не разово.
//
// ## Что записано в первом снимке
//
// Вывод, снятый после замены `@pandacss/core` на `postcss` + `postcss-nested` (2026-08-20).
// Сверен с эталоном, снятым ДО замены: те же 23 правила, те же селекторы, тот же порядок,
// совпадение текста при нормализации пробелов. Разошлись ОТСТУПЫ, и в лучшую сторону — у Panda
// проход расстановки отступов зарегистрирован в одном конвейере с разворотом и успевает
// отработать до того, как вложенные блоки вынесены наверх; наш идёт после. Подробности — шапка
// `src/format.ts`.

import { describe, expect, it } from "vitest";

import { flattenCss } from "../src/flatten.js";
import { generateSketchCss, generateSkinCss } from "../src/generate.js";
import { lookup } from "./passports.js";
import { nestedEdits, nestedSkin } from "./skins.js";

const skinCss = generateSkinCss(nestedSkin, lookup);
const sketchCss = generateSketchCss(nestedEdits, lookup);

describe("текст порождения — вложенная форма", () => {
  it("скин со всем разрешённым вложением", async () => {
    await expect(skinCss).toMatchFileSnapshot("./__snapshots__/skin.nested.css");
  });

  it("правки образца", async () => {
    await expect(sketchCss).toMatchFileSnapshot("./__snapshots__/sketch.nested.css");
  });

  it("вложенность в тексте есть — иначе разворачивать было бы нечего", () => {
    expect(skinCss).toContain("&::before");
    expect(skinCss).toContain("@media (min-width: 40rem)");
  });
});

describe("текст порождения — плоская форма", () => {
  it("скин со всем разрешённым вложением", async () => {
    await expect(flattenCss(skinCss)).toMatchFileSnapshot("./__snapshots__/skin.css");
  });

  it("правки образца", async () => {
    await expect(flattenCss(sketchCss)).toMatchFileSnapshot("./__snapshots__/sketch.css");
  });

  it("плоская форма плоская: вложенных блоков не осталось", () => {
    const flat = flattenCss(skinCss);

    expect(flat).not.toContain("&");
  });
});

describe("устойчивость", () => {
  it("порождение: два вызова подряд дают один и тот же текст", () => {
    const twice = generateSkinCss(nestedSkin, lookup);

    expect(twice).toBe(skinCss);
  });

  it("разворот: конвейер не копит состояние между вызовами", () => {
    // Конвейер postcss заводится один раз на модуль. Копил бы — второй скин в том же сеансе
    // редактора выходил бы другим.
    expect(flattenCss(skinCss)).toBe(flattenCss(skinCss));
  });
});
