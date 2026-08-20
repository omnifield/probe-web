// ПОРОЖДЕНИЕ CSS — превращение собранных правил в текст, который приложение надевает.
//
// ## Что здесь своё, а что чужое
//
// Своего тут ровно два действия: печать объявлений и обёртка в слой каскада. Разворот
// вложенного (`&::before`, `@media`) в плоский текст делает `expandNestedCss` из
// `@pandacss/core` — та единственная утилита, ради которой пакет взят (замер `PWEB-28`).
//
// Панду целиком в генераторы не берут: его модель вывода — атомарные классы, которые надо
// навешивать на узел, а кит голый и классов не носит. Взята одна функция, и делает она ровно то,
// чего у нас нет.
//
// ## Почему текст, а не объект
//
// Валюта скина — ТЕКСТ СТИЛЕЙ, а не адрес файла и не объект: хранилище держит скин структурой,
// CSS из неё порождается в браузере, и файла с адресом в этом пути не существует ни на одном
// шаге. Это же объявлено контрактом источника скинов в зоне `runtime` (`SkinSource.css`).
//
// ## Разрез между скином и правкой образца — машинный
//
// Две функции, а не одна с отбором. Скин на вход второй не приходит вовсе, правки — на вход
// первой: утечь нечему. Держи мы это фильтром — правки образца рано или поздно уехали бы в файл
// скина, и приложение получило бы вид, привязанный к идентификаторам чужого стенда.

import { expandNestedCss } from "@pandacss/core";

import type { PassportLookup } from "./address.js";
import { DARK_CLASS, LAYER_ORDER, SKETCH_LAYER, SKIN_LAYER } from "./marks.js";
import type { Skin, SketchEdit, StyleObject, StyleValue } from "./recipe.js";
import {
  skinRules,
  sketchRules,
  type SkinFlaw,
  type SkinRule,
  type ValueVocabulary,
} from "./rules.js";
import { trace } from "./trace.js";

/**
 * ОТКАЗ порождения: скин с изъянами в текст не превращается.
 *
 * Исключением, а не значением, и это единственное место в зоне, где так. Причина в том, что
 * отвергается: «неизвестное значение молча проезжает в вывод» — замеренный дефект, чинить
 * который человек идёт в ВИД, потому что видит испорченную кнопку, а не сообщение. Вернув текст
 * с изъяном рядом, мы бы оставили ровно ту же дорогу — вызывающий волен изъяны не смотреть.
 *
 * Кому нужен список, а не отказ, зовёт `checkSkin`: это тот же обход, и второй правды о
 * законности в зоне нет.
 */
export class SkinRefused extends Error {
  /** Всё найденное сразу, а не первое попавшееся: человек чинит запись целиком. */
  readonly flaws: readonly SkinFlaw[];

  constructor(what: string, flaws: readonly SkinFlaw[]) {
    super(
      `[probe-web-skin] ${what} не порождён: ${flaws.length} изъян(ов).\n` +
        flaws.map((flaw) => `  • ${flaw.name} — ${flaw.where}: ${flaw.means}`).join("\n"),
    );
    this.name = "SkinRefused";
    this.flaws = flaws;
  }
}

/**
 * Имя свойства в CSS-начертании.
 *
 * Два начертания принимаются оба (`borderWidth` и `border-width`), потому что взятая форма
 * рецепта пишется первым, а CSS понимает второе. Кастом-свойства не трогаются: `--моё-имя` — уже
 * имя, а не запись.
 */
function cssProperty(name: string): string {
  return name.startsWith("--") ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/** Печатает объявления и вложенные блоки. Вложенное разворачивает не она, а `expandNestedCss`. */
function declarations(style: StyleObject, indent: string): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;

    if (typeof value === "object") {
      lines.push(`${indent}${key} {`, ...declarations(value, `${indent}  `), `${indent}}`);
      continue;
    }

    lines.push(`${indent}${cssProperty(key)}: ${value as StyleValue};`);
  }

  return lines;
}

/** Печатает одно правило. */
function ruleText(rule: SkinRule): string {
  return [`  ${rule.selector} {`, ...declarations(rule.style, "    "), "  }"].join("\n");
}

/** Печатает блок значений: имя без `--` в записи, с `--` в файле. */
function valuesText(selector: string, values: Readonly<Record<string, string>>): string {
  return [
    `  ${selector} {`,
    ...Object.entries(values).map(([name, value]) => `    --${name}: ${value};`),
    "  }",
  ].join("\n");
}

/**
 * Печатает переменные скина обеими половинами пары.
 *
 * Селектор светлой половины — просто корень: скин подключён ровно тогда, когда его лист в
 * документе, и цепляться за `data-skin` файл не обязан (контракт корня, зона `runtime`).
 * Тёмная — тот же корень плюс класс режима, в обеих формах носителя: класс может стоять и на
 * самом корне, и на предке внутри него. Форма взята у зоны значений (`paletteSelector`), чтобы
 * два поставщика значений включались одинаково.
 */
function variablesText(skin: Skin): string[] {
  const blocks: string[] = [];
  const light = skin.variables?.light;
  const dark = skin.variables?.dark;

  if (light && Object.keys(light).length > 0) blocks.push(valuesText(":root", light));
  if (dark && Object.keys(dark).length > 0) {
    blocks.push(valuesText(`:root.${DARK_CLASS}, :root .${DARK_CLASS}`, dark));
  }

  return blocks;
}

/** Печатает именованные движения. Принадлежат скину целиком, а не одной части. */
function keyframesText(skin: Skin): string[] {
  return Object.entries(skin.keyframes ?? {}).map(([name, frames]) =>
    [`  @keyframes ${name} {`, ...declarations(frames, "    "), "  }"].join("\n"),
  );
}

/** Оборачивает содержимое в слой каскада и разворачивает вложенное. */
function layered(header: string, layer: string, blocks: readonly string[]): string {
  const done = trace(`expandNestedCss(${layer})`);
  const text = [header, LAYER_ORDER, "", `@layer ${layer} {`, ...blocks, "}", ""].join("\n");
  const flat = expandNestedCss(text);
  done();
  return flat;
}

/**
 * Порождает файл стилей СКИНА.
 *
 * ```ts
 * import { passportOf, PASSPORTS } from "@omnifield/probe-web-ui/passport";
 * import { SCALE_TOKENS } from "@omnifield/probe-web-style";
 *
 * const css = generateSkinCss(skin, passportOf, { tokens: SCALE_TOKENS });
 * ```
 *
 * Словарь значений передаётся снаружи намеренно: скин вправе стоять на нашем наборе, на чужом
 * или ни на каком, и зависимость отсюда на набор значений сделала бы «инструменты необязательны»
 * словом.
 *
 * @param skin скин целиком: переменные, рецепты, движения
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 * @returns готовый текст стилей — та самая валюта, которой источник скинов кормит `runtime`
 * @throws {SkinRefused} если в записи есть хоть один изъян
 */
export function generateSkinCss(
  skin: Skin,
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): string {
  const done = trace(`generateSkinCss(${skin.name})`);

  const { rules, flaws } = skinRules(skin, lookup, vocabulary);
  if (flaws.length > 0) throw new SkinRefused(`скин «${skin.name}»`, flaws);

  const css = layered(
    `/* Скин «${skin.name}» — порождён механикой скина из записи.\n` +
      "   Править бесполезно: следующее порождение перезапишет.\n" +
      "   Адреса собраны из анатомии компонентов, руками селекторы не писались. */",
    SKIN_LAYER,
    [...variablesText(skin), ...keyframesText(skin), ...rules.map(ruleText)],
  );

  done();
  return css;
}

/**
 * Порождает файл стилей ПРАВОК ОБРАЗЦА — вторая область адреса, тот же генератор.
 *
 * Уезжает в свой слой каскада, объявленный ПОСЛЕ скинового: правка образца обязана перебивать
 * скин, а по весу селектора выходит наоборот.
 *
 * @param edits правки по узлам
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 * @throws {SkinRefused} если в правках есть хоть один изъян
 */
export function generateSketchCss(
  edits: readonly SketchEdit[],
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): string {
  const done = trace(`generateSketchCss(${edits.length})`);

  const { rules, flaws } = sketchRules(edits, lookup, vocabulary);
  if (flaws.length > 0) throw new SkinRefused("правки образца", flaws);

  const css = layered(
    "/* Правки образца — порождены механикой скина по именам узлов.\n" +
      "   Это НЕ скин: адрес здесь — одно место, а не координата, и в файл скина он не едет. */",
    SKETCH_LAYER,
    rules.map(ruleText),
  );

  done();
  return css;
}
