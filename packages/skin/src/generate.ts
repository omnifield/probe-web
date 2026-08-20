// ПОРОЖДЕНИЕ CSS — превращение собранных правил в текст, который приложение надевает.
//
// ## Что здесь своё, а что чужое
//
// Своего тут три действия: печать объявлений, обёртка в слой каскада и расстановка отступов
// (`format.ts`). Разворот вложенного (`&::before`, `@media`) в плоский текст делает
// `postcss-nested` — то средство, которым разворачивание и делается.
//
// ## Почему `postcss-nested`, а не `@pandacss/core`
//
// Замер 2026-08-20. Задача называла взятым `@pandacss/core` — и он подходит, но внутри его
// `expandNestedCss` лежит ровно `postcss([nested(), prettify()])`, где `prettify` — полтора
// десятка строк расстановки отступов. То есть весь предмет заимствования это `postcss-nested`
// плюс форматирование.
//
// Цена разная на порядок:
//
//   `@pandacss/core`             9,0 МБ · 33 пакета  (browserslist с базой браузеров,
//                                                     ts-pattern, lodash.merge, шесть
//                                                     собственных подпакетов Panda)
//   `postcss` + `postcss-nested` 1,1 МБ ·  8 пакетов
//
// Взятое едет ПОТРЕБИТЕЛЮ, и восемь мегабайт транзитивных зависимостей ради полутора десятков
// строк форматирования — плата не за средство, а за то, что средство завёрнуто в чужой продукт.
// Правило «берём существующее» этим не нарушено, а исполнено точнее: берём ровно то средство, на
// котором стоит и сам Panda.
//
// Потерялось при замене РОВНО одно: их `prettify`. Он заменён своим (`format.ts`), и вывод
// сверен с эталоном, снятым ДО замены, — те же 23 правила, те же селекторы, тот же порядок,
// совпадение текста при нормализации пробелов и завершающих точек с запятой. Отличаются только
// отступы, и в лучшую сторону; чем именно и почему — шапка `format.ts`.
//
// Панду целиком в генераторы не берут в любом случае: его модель вывода — атомарные классы,
// которые надо навешивать на узел, а кит голый и классов не носит.
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

import postcss from "postcss";
import nested from "postcss-nested";

import type { PassportLookup } from "./address.js";
import { prettify } from "./format.js";
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

/** Печатает объявления и вложенные блоки. Вложенное разворачивает не она, а `postcss-nested`. */
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

/** Разворачиватель вложенного. Заводится один раз: конвейер postcss переиспользуем. */
const flatten = postcss([nested()]);

/** Оборачивает содержимое в слой каскада и разворачивает вложенное. */
function layered(header: string, layer: string, blocks: readonly string[]): string {
  const done = trace(`postcss-nested(${layer})`);
  const text = [header, LAYER_ORDER, "", `@layer ${layer} {`, ...blocks, "}", ""].join("\n");

  // `root` у синхронного конвейера доступен сразу; отступы правим по дереву, а не по строке —
  // регулярное выражение по CSS ошибается на первом же значении со скобками.
  const root = flatten.process(text, { from: undefined }).root;
  prettify(root);

  done();
  return root.toString();
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
