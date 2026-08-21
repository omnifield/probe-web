// ПОРОЖДЕНИЕ CSS — превращение собранных правил в текст, который приложение надевает.
//
// ## Форма вывода здесь ВЛОЖЕННАЯ, и это не полуфабрикат
//
// Вложенность CSS — Baseline Widely Available с 11 июня 2026, охват 94,1 % (сверено
// архитектором скина 2026-08-20 по обозревателю возможностей платформы). Браузер разворачивает
// её сам, и текст отсюда годится в лист стилей КАК ЕСТЬ.
//
// Разворачивать её нам нужно ровно там, где плоская форма правда нужна: файл на диск, старый
// клиент, сверка снимком. Это отдельный подпуть `./flat` и отдельная зависимость — см.
// `flatten.ts`.
//
// Цена вопроса замерена, а не предположена: сборка витрины со `postcss` в цепочке — 257,06 КБ,
// без него — см. замер в README. Витрина и редактор порождают CSS НА КАЖДОЕ ДВИЖЕНИЕ РУЧКИ, и
// разворачиватель был их главным весом при том, что разворачивать для браузера нечего.
//
// **Второго генератора при этом нет.** Сборка рецепта одна (`rules.ts`), печать одна (здесь),
// а плоская форма получается из вложенной одним вызовом. Обе формы описывают ОДИН вид, и это
// проверяется сравнением после разворачивания, а не обещанием.
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

import type { PassportLookup } from "./address.js";
import { DARK_CLASS, LAYER_ORDER, SKETCH_LAYER, SKIN_LAYER } from "./marks.js";
import { cssProperty } from "./property.js";
import { skinValues } from "./seeds.js";
import type { Skin, SketchEdit, StyleObject, StyleValue } from "./recipe.js";
import {
  skinRules,
  sketchRules,
  type CssRule,
  type SkinFlaw,
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

/** Печатает объявления и вложенные блоки. Вложенность остаётся вложенностью. */
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
function ruleText(rule: CssRule): string {
  return [`  ${rule.selector} {`, ...declarations(rule.style, "    "), "  }"].join("\n");
}

/** Печатает блок значений: имя без `--` в записи, с `--` в файле. */
function valuesText(selector: string, values: readonly (readonly [string, string])[]): string {
  return [
    `  ${selector} {`,
    ...values.map(([name, value]) => `    --${name}: ${value};`),
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
  const light = skinValues(skin, "light");
  const dark = skinValues(skin, "dark");

  if (light.size > 0) {
    blocks.push(valuesText(":root", [...light].map(([name, own]) => [name, own.value])));
  }

  // В тёмный блок едет только ОТЛИЧАЮЩЕЕСЯ. Половины пересекаются почти целиком — имя без семени
  // объявлено один раз, затемнение под слоем от режима не зависит, — и печатать совпадающее
  // второй раз значило бы удваивать файл ради строк, которые ничего не меняют.
  const differs = [...dark]
    .filter(([name, own]) => light.get(name)?.value !== own.value)
    .map(([name, own]): [string, string] => [name, own.value]);

  if (differs.length > 0) {
    blocks.push(valuesText(`:root.${DARK_CLASS}, :root .${DARK_CLASS}`, differs));
  }

  return blocks;
}

/** Печатает именованные движения. Принадлежат скину целиком, а не одной части. */
function keyframesText(skin: Skin): string[] {
  return Object.entries(skin.keyframes ?? {}).map(([name, frames]) =>
    [`  @keyframes ${name} {`, ...declarations(frames, "    "), "  }"].join("\n"),
  );
}

/**
 * Оборачивает содержимое в слой каскада.
 *
 * Больше здесь ничего не происходит: текст блоков уже готов, вложенность в нём законная, и
 * разворачивать её для браузера незачем. Отступы расставлены при печати — своим кодом, а не
 * проходом по разобранному дереву.
 */
function layered(header: string, layer: string, blocks: readonly string[]): string {
  return [header, LAYER_ORDER, "", `@layer ${layer} {`, ...blocks, "}", ""].join("\n");
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
 * @returns готовый текст стилей ВО ВЛОЖЕННОЙ форме — та самая валюта, которой источник скинов
 *   кормит `runtime`. Плоская форма — `flattenCss` из подпути `./flat`
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
