// СБОРКА РЕЦЕПТА — то единственное из трёх кусков порождения, что пишем сами.
//
// Порождение развёрнуто на три части (страница «Основания», раздел 7):
//
//   разрешение значений         — чужое и уже есть: это `var()` браузера и зона значений;
//   СБОРКА РЕЦЕПТА ПО ЧАСТЯМ    — здесь;
//   вложенное правило в текст   — чужое: `postcss-nested`, вызывается в `generate.ts`.
//
// ## Один обход, два потребителя
//
// Обход рецепта отдаёт СРАЗУ И правила, И изъяны. Разделить их на «проверку» и «сборку» значило
// бы написать обход дважды: два обхода одной формы расходятся молча, и правым оказывается тот,
// кого позвали последним. Поэтому `checkSkin` и `generateSkinCss` — два вызова ОДНОГО обхода,
// а не две реализации.
//
// ## Порядок правил значим, и он не совпадает с порядком записи
//
// Вес селектора решает не всё. `base.root.states.hover` весит столько же, сколько
// `variants.danger.root`: три атрибута против трёх. При равном весе побеждает то, что стоит
// ПОЗЖЕ, — значит порядок обязан быть объявлен, а не получиться.
//
// Правило простое: чем БОЛЬШЕ СОСТОЯНИЙ у правила, тем позже оно стоит. Наведённая кнопка
// показывает наведение, даже если у неё есть вариация, которая про наведение ничего не сказала.
//
// Считаются именно состояния, а вариация — нет, и это не произвол: тот же порядок даёт взятая
// форма. У Panda имя вариации — один класс, а состояние — псевдокласс ПОВЕРХ него, то есть
// состояние тяжелее вариации по построению. У нас оба выражены атрибутом и весят одинаково,
// поэтому разницу приходится держать порядком — иначе «опасная» перебила бы наведение, чего в
// исходной форме не происходит.
//
// При равном числе состояний порядок — по происхождению: база, вариация, пересечение.
// Пересечение собрано автором последним и последним же побеждает.

import type { ComponentPassport } from "@omnifield/probe-web-ui/passport";

import {
  anyOf,
  ancestorSelector,
  nodeSelector,
  partSelector,
  safeName,
  stateSelector,
  variantAlternatives,
  variantSelector,
  type PassportLookup,
} from "./address.js";
import type {
  AncestorStyle,
  CompoundVariant,
  LocalStyle,
  PartStyle,
  PartStyles,
  Skin,
  SketchEdit,
  SlotRecipe,
  StyleObject,
} from "./recipe.js";
import { seedRefusals, valueNames } from "./seeds.js";
import { homesText, partVariables, variableHomes, type VariableHome } from "./variables.js";
import { sizeRefusals } from "./sizes.js";
import { note, trace } from "./trace.js";

/**
 * Имя изъяна. Именованный отказ, а не `false`: редактор показывает человеку причину, а проба
 * проверяет ИМЕННО ТУ причину, ради которой написана.
 *
 *  • `unknown-component`   — рецепт на компонент, паспорта у которого нет;
 *  • `unknown-part`        — части нет в анатомии компонента;
 *  • `unknown-state`       — состояния часть не объявляла;
 *  • `unknown-ancestor`    — компонента-предка или его части нет;
 *  • `unknown-variant`     — пересечение или умолчание называет вариацию, которой в рецепте нет;
 *  • `default-missing`     — вариации есть, а умолчание не названо;
 *  • `variant-unaddressable` — ось вариаций выражена не атрибутом: имя в разметку не попадёт;
 *  • `unsafe-name`         — имя не годится внутрь селектора;
 *  • `bad-seed`            — семя шкалы не разбирается как цвет: лестницу из него не построить;
 *  • `bad-size`            — размерный набор не сходится: имени шкалы нет либо плотность не названа;
 *  • `unknown-value`       — ссылка на значение, которого нет в словаре, и без запасного;
 *  • `variable-elsewhere`  — переменная объявлена паспортом, но НА ДРУГОЙ ЧАСТИ: здесь её не ставят;
 *  • `empty-value`         — значение пусто: правило было бы мёртвым;
 *  • `free-selector`       — вложенный ключ, не являющийся ни псевдоэлементом, ни at-правилом.
 */
export type SkinFlawName =
  | "unknown-component"
  | "unknown-part"
  | "unknown-state"
  | "unknown-ancestor"
  | "unknown-variant"
  | "default-missing"
  | "variant-unaddressable"
  | "unsafe-name"
  | "bad-seed"
  | "bad-size"
  | "unknown-value"
  | "variable-elsewhere"
  | "empty-value"
  | "free-selector";

/** Изъян скина: имя, место в записи и пояснение человеку. */
export interface SkinFlaw {
  readonly name: SkinFlawName;
  /** Место в записи: `recipes.button.variants.danger.root.states.hover`. */
  readonly where: string;
  /** Что это значит человеку и редактору. */
  readonly means: string;
}

/** Готовое правило: селектор и стилевой объект, который под ним стоит. */
export interface CssRule {
  /** Полный селектор — порождён из координаты, руками не написан. */
  readonly selector: string;
  /** Вид: свойства и разрешённые вложенные блоки. */
  readonly style: StyleObject;
  /** Число условий адреса — им задаётся порядок при равном весе селектора. */
  readonly conditions: number;
  /** Происхождение: 0 база, 1 вариация, 2 пересечение. Вторичный ключ порядка. */
  readonly origin: number;
}

/**
 * АДРЕС правила в рецепте — то, чем оно адресовано, до превращения в селектор.
 *
 * Отдаётся наружу, потому что читателей у него больше одного: покрытие спрашивает, какие
 * координаты одеты, читаемость — какие значения сходятся на одной координате. Считай каждый из
 * них адрес по-своему, разбирая селектор обратно, — и мы получили бы два разбора одной строки,
 * расходящихся на первом же новом виде адреса.
 */
export interface RuleCoordinate {
  /** Имя компонента, оно же `data-scope`. */
  readonly component: string;
  /** Часть — ключ анатомии. */
  readonly part: string;
  /**
   * Имена вариаций, при которых правило действует.
   *
   * Пусто — при любой: так выглядит база. Несколько — так выглядит пересечение, названное
   * автором рецепта.
   */
  readonly variants: readonly string[];
  /** Состояния СВОЕЙ части, набранные к этому правилу. */
  readonly states: readonly string[];
  /** Предок и его состояния — если правило от них зависит. */
  readonly ancestor?: {
    readonly component: string;
    readonly part: string;
    readonly states: readonly string[];
  };
}

/** Правило из РЕЦЕПТА: несёт адрес, по которому его собрали. */
export interface SkinRule extends CssRule {
  readonly coordinate: RuleCoordinate;
}

/** Что вышло из обхода рецептов: правила в порядке каскада и все изъяны сразу. */
export interface SkinRules {
  readonly rules: readonly SkinRule[];
  readonly flaws: readonly SkinFlaw[];
}

/**
 * Что вышло из обхода ПРАВОК ОБРАЗЦА.
 *
 * Координаты у этих правил нет и не заводится: правка образца адресует ОДНО МЕСТО. Приписать ей
 * координату значило бы объявить одетой координату, которой вида не давали.
 */
export interface SketchRules {
  readonly rules: readonly CssRule[];
  readonly flaws: readonly SkinFlaw[];
}

/** Словарь известных имён значений — то, на что скин вправе ссылаться. */
export interface ValueVocabulary {
  /**
   * Имена значений, объявленных СНАРУЖИ: наш набор значений, чужой набор, ничего.
   *
   * Принимаем снаружи, а не читаем у зоны значений: скин, написанный без единого нашего
   * инструмента и без нашего набора, обязан быть законным и проходить проверки (страница
   * «Устройство»). Зависимость отсюда на набор значений сделала бы «необязательно» словом.
   *
   * Имя принимается в обоих начертаниях — `brand-9` и `--brand-9`.
   */
  readonly tokens?: Iterable<string>;
}

/** Вложенные ключи, которые НЕ являются свободным селектором. */
const NESTED_AT_RULES = ["@media", "@supports", "@container"];

/**
 * Ссылка на значение: имя и то, есть ли за ним запасное.
 *
 * Имя набирается «всё до пробела, запятой или скобки», а не перечнем букв: имена в этом продукте
 * пишутся и кириллицей тоже, а `\w` в регулярном выражении — латиница с цифрами. Перечень
 * пропустил бы `var(--нет-такого)` мимо проверки, то есть отменил бы её ровно там, где она
 * заведена.
 */
const VAR_REFERENCE = /var\(\s*(--[^\s,)]+)\s*(,?)/gu;

/** Приводит имя значения к записи с двумя дефисами. */
function customProperty(name: string): string {
  return name.startsWith("--") ? name : `--${name}`;
}

/**
 * Собирает словарь: объявленное снаружи плюс собственные значения скина.
 *
 * Собственные — это и литералы, и построенное семенами: ссылка на ступень объявленной шкалы
 * (`var(--бренд-9)`) обязана считаться известной, иначе семенной скин уезжал бы в изъяны целиком.
 * Имена берутся у того же построения, что даёт значения, — второй их перечень разошёлся бы с
 * первым на первом же новом ряде.
 */
function vocabularyOf(skin: Skin | undefined, vocabulary: ValueVocabulary): Set<string> {
  const known = new Set<string>();

  for (const token of vocabulary.tokens ?? []) known.add(customProperty(token));
  if (skin) for (const name of valueNames(skin)) known.add(customProperty(name));

  return known;
}

/** Копилка изъянов — чтобы обход не таскал массив параметром через каждый уровень. */
class Flaws {
  readonly list: SkinFlaw[] = [];

  add(name: SkinFlawName, where: string, means: string): void {
    this.list.push({ name, where, means });
    note(`изъян ${name} в ${where}: ${means}`);
  }
}

/**
 * Проверяет ЗНАЧЕНИЯ и вложенные ключи одного стилевого объекта.
 *
 * Ссылка на значение — это `var(--имя)`, и другого способа сослаться мы не заводим. Свой словарь
 * коротких имён (`brand.solid` → `var(--brand-9)`) был бы ВТОРОЙ адресацией значений: та, что
 * есть, уже работает в браузере, а вторая обязана была бы с ней совпадать — и разошлась бы на
 * первом же новом токене.
 *
 * Имя с ЗАПАСНЫМ значением (`var(--моё, 4px)`) пропускается, даже если оно неизвестно: автор
 * прямо назвал, что будет, если имени нет. Без запасного неизвестное имя — отказ: замерено, что
 * такое правило браузер выбрасывает целиком, а чинить человек идёт ВИД (`PWEB-28`).
 */
function checkStyle(
  style: StyleObject,
  where: string,
  known: Set<string>,
  flaws: Flaws,
  homes: Map<string, VariableHome[]> = new Map(),
): void {
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined) continue;

    const at = `${where}.${key}`;

    if (typeof value === "object") {
      const nested =
        key.startsWith("&::") || NESTED_AT_RULES.some((rule) => key.startsWith(rule));

      if (!nested) {
        flaws.add(
          "free-selector",
          at,
          `вложенный ключ «${key}» — свободный селектор. Часть, состояние и предок адресуются ` +
            "координатой, а не селектором; вложением разрешены только псевдоэлемент (`&::…`) " +
            `и at-правило (${NESTED_AT_RULES.join(", ")})`,
        );
        continue;
      }

      checkStyle(value, at, known, flaws, homes);
      continue;
    }

    checkValue(value, at, known, flaws, homes);
  }
}

/**
 * Проверяет ОДНО значение.
 *
 * Вынесено отдельно, потому что читателей два: свойства правила и ступени именованного
 * движения. Форма у них разная — у движения вложенность это `from`/`to`/`50%`, а не селектор, —
 * а требование к значению одно, и второй его копии быть не должно.
 */
function checkValue(
  value: string | number,
  at: string,
  known: Set<string>,
  flaws: Flaws,
  homes: Map<string, VariableHome[]> = new Map(),
): void {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) flaws.add("empty-value", at, "число не является значением");
    return;
  }

  if (value.trim() === "") {
    flaws.add("empty-value", at, "пустое значение — правило было бы мёртвым");
    return;
  }

  for (const [, name, fallback] of value.matchAll(VAR_REFERENCE)) {
    if (fallback === "," || known.has(name)) continue;

    // ОБЪЯВЛЕНА, НО НЕ ЗДЕСЬ — отдельный изъян, а не оттенок предыдущего (`PWEB-93`). Причина
    // другая и починка другая: правило переносят на ту часть или адресуют её по предку, а не
    // дописывают роль в палитру. Слей мы их — человек пошёл бы чинить не то.
    const где = homes.get(name!);
    if (где) {
      flaws.add(
        "variable-elsewhere",
        at,
        `переменную «${name}» объявляет паспорт, но на другой части — ${homesText(где)}. ` +
          "Здесь её никто не ставит: правило приедет на страницу с неразрешимым значением. " +
          "Перенеси правило на ту часть либо адресуй её по предку",
      );
      continue;
    }

    flaws.add(
      "unknown-value",
      at,
      `имя «${name}» не объявлено ни скином, ни словарём, ни паспортом. Браузер выбросит правило ` +
        `целиком, и чинить будут вид. Запасное значение — \`var(${name}, …)\` — снимает отказ`,
    );
  }
}

/**
 * Проверяет именованное движение: ступени и значения в них.
 *
 * Вложенность у движения своя и селектором не является: `from`, `to`, `50%` — это ступени, а не
 * адреса. Гонять их через проверку свободного селектора значило бы отвергнуть законную запись.
 */
function checkKeyframes(
  frames: StyleObject,
  where: string,
  known: Set<string>,
  flaws: Flaws,
): void {
  for (const [stop, style] of Object.entries(frames)) {
    if (style === undefined) continue;

    const at = `${where}.${stop}`;

    if (typeof style !== "object") {
      flaws.add("free-selector", at, `ступень движения «${stop}» обязана быть блоком свойств`);
      continue;
    }

    for (const [property, value] of Object.entries(style)) {
      if (value === undefined) continue;

      if (typeof value === "object") {
        flaws.add("free-selector", `${at}.${property}`, "внутри ступени движения вложения нет");
        continue;
      }

      checkValue(value, `${at}.${property}`, known, flaws);
    }
  }
}

/** Есть ли в объекте хоть одно объявление: пустое правило в текст не едет. */
function declares(style: StyleObject): boolean {
  return Object.values(style).some((value) => value !== undefined);
}

/**
 * ПОСТОЯННОЕ на весь обход: куда складывать, чем искать паспорт, что считать известным.
 *
 * Одним объектом, а не пятью параметрами через все уровни: у обхода шесть функций, и каждая
 * протаскивала бы их насквозь, ничего с ними не делая. Переменная часть — курсор (`Cursor`),
 * она у каждого уровня своя.
 *
 * Тип-параметр `Mark` — то, чем правило подписывается СВЕРХ селектора: обход рецептов ставит
 * координату, обход правок образца не ставит ничего. Обход при этом ОДИН: развести его на две
 * копии ради одного поля значило бы завести вторую правду о том, как рецепт разворачивается.
 */
interface Walk<Mark> {
  /** Чем найти паспорт по имени компонента: нужен предку, живущему в чужом дереве. */
  readonly lookup: PassportLookup;
  /** Известные имена значений. */
  readonly known: Set<string>;
  /**
   * Где объявлена каждая переменная паспорта — чтобы отличить «не здесь» от «нигде».
   *
   * Без этого оба случая слились бы в один изъян, и человек, поставивший правило не на ту часть,
   * пошёл бы чинить палитру (`PWEB-93`).
   */
  readonly homes: Map<string, VariableHome[]>;
  readonly flaws: Flaws;
  readonly out: (CssRule & Mark)[];
  /** Чем подписать правило, стоящее в этом месте обхода. */
  mark(cursor: Cursor): Mark;
}

/** ПЕРЕМЕННОЕ: где обход сейчас находится и что уже набрал в селектор. */
interface Cursor {
  readonly passport: ComponentPassport;
  readonly part: string;
  /**
   * Словарь ЭТОЙ части: общий плюс переменные, объявленные ею в паспорте (`PWEB-93`).
   *
   * Свой у каждой части, а не один на обход: `--height` объявлен содержимым гармошки, и правило
   * на кнопке ссылаться на него не вправе — там его никто не ставит.
   */
  readonly known: Set<string>;
  /** Селектор части вместе с уже набранными вариацией и состояниями. */
  readonly own: string;
  /** Селектор предка, если он есть, — встаёт слева. */
  readonly prefix: string;
  /** Имена вариаций, при которых правило действует. Пусто — при любой. */
  readonly variants: readonly string[];
  /**
   * Состояния СВОЕЙ части, набранные к этому месту.
   *
   * Именно свои: состояния предка сюда не попадают. Предок в правиле — условие, а вид получает
   * наша часть, и записывать предку покрытие значило бы объявить одетым то, чему вида не дали.
   */
  readonly states: readonly string[];
  /** Предок и его состояния, если обход спустился в правило от предка. */
  readonly ancestor?: RuleCoordinate["ancestor"];
  /** Число условий адреса — им задаётся порядок при равном весе селектора. */
  readonly conditions: number;
  /** Происхождение: 0 база, 1 вариация, 2 пересечение. */
  readonly origin: number;
}

/**
 * Вариация на входе обхода: селектор и ИМЕНА, которые он выражает.
 *
 * Пара, а не одна строка: селектор нужен печати, имена — адресу. Восстанавливать имена из
 * селектора обратно значило бы разбирать собственную же запись.
 */
interface Variant {
  readonly selector: string;
  readonly names: readonly string[];
}

/** «При любой вариации» — так адресована база. */
const ANY_VARIANT: Variant = { selector: "", names: [] };

/** Подпись правила из рецепта — его адрес. */
function coordinateOf(cursor: Cursor): { coordinate: RuleCoordinate } {
  return {
    coordinate: {
      component: cursor.passport.component,
      part: cursor.part,
      variants: cursor.variants,
      states: cursor.states,
      ...(cursor.ancestor ? { ancestor: cursor.ancestor } : {}),
    },
  };
}

/** Разворачивает вид под одним селектором: свои свойства, затем состояния части. */
function growLocal<Mark>(
  cursor: Cursor,
  style: LocalStyle,
  where: string,
  walk: Walk<Mark>,
): void {
  if (style.props && declares(style.props)) {
    checkStyle(style.props, `${where}.props`, cursor.known, walk.flaws, walk.homes);
    walk.out.push({
      ...walk.mark(cursor),
      selector: cursor.prefix === "" ? cursor.own : `${cursor.prefix} ${cursor.own}`,
      style: style.props,
      conditions: cursor.conditions,
      origin: cursor.origin,
    });
  }

  for (const [state, nested] of Object.entries(style.states ?? {})) {
    const mark = stateSelector(cursor.passport, cursor.part, state);

    if (mark === undefined) {
      walk.flaws.add(
        "unknown-state",
        `${where}.states.${state}`,
        `часть «${cursor.part}» компонента «${cursor.passport.component}» такого состояния не ` +
          "объявляла. Правило, адресующее необъявленное состояние, невалидно",
      );
      continue;
    }

    growLocal(
      {
        ...cursor,
        own: cursor.own + mark,
        states: [...cursor.states, state],
        conditions: cursor.conditions + 1,
      },
      nested,
      `${where}.states.${state}`,
      walk,
    );
  }
}

/** Разворачивает правила «часть выглядит так, когда её владелец в таком состоянии». */
function growAncestor<Mark>(
  cursor: Cursor,
  ancestor: AncestorStyle,
  where: string,
  walk: Walk<Mark>,
): void {
  const owner = walk.lookup(ancestor.component);
  const prefix = owner && ancestorSelector(owner, ancestor.part, ancestor.states);

  if (!prefix) {
    walk.flaws.add(
      "unknown-ancestor",
      where,
      `предок «${ancestor.component}.${ancestor.part}» не объявлен: нет паспорта, части или ` +
        "одного из названных состояний",
    );
    return;
  }

  growLocal(
    {
      ...cursor,
      prefix,
      ancestor: {
        component: ancestor.component,
        part: ancestor.part,
        states: ancestor.states ?? [],
      },
      conditions: cursor.conditions + (ancestor.states?.length ?? 0),
    },
    ancestor.style,
    `${where}.style`,
    walk,
  );
}

/** Разворачивает вид одной части целиком: свой адрес и уточнения по предку. */
function growPart<Mark>(
  passport: ComponentPassport,
  part: string,
  /** Селектор вариации и имена, которые он выражает. */
  variant: Variant,
  origin: number,
  style: PartStyle,
  where: string,
  walk: Walk<Mark>,
): void {
  const own = partSelector(passport, part);

  if (own === undefined) {
    walk.flaws.add(
      "unknown-part",
      where,
      `компонент «${passport.component}» части «${part}» не объявлял: адресовать нечего`,
    );
    return;
  }

  const cursor: Cursor = {
    passport,
    part,
    // Переменные части кладутся В СЛОВАРЬ, а не проверяются отдельной веткой: для правила они
    // такие же известные имена, как ступени палитры, и разница только в том, кто их ставит.
    known: new Set([...walk.known, ...partVariables(passport, part)]),
    own: own + variant.selector,
    prefix: "",
    variants: variant.names,
    states: [],
    conditions: 0,
    origin,
  };

  growLocal(cursor, style, where, walk);

  for (const [index, ancestor] of (style.ancestors ?? []).entries()) {
    growAncestor(cursor, ancestor, `${where}.ancestors[${index}]`, walk);
  }
}

/** Разворачивает вид по частям. */
function growParts<Mark>(
  passport: ComponentPassport,
  variant: Variant,
  origin: number,
  parts: PartStyles,
  where: string,
  walk: Walk<Mark>,
): void {
  for (const [part, style] of Object.entries(parts)) {
    growPart(passport, part, variant, origin, style, `${where}.${part}`, walk);
  }
}

/** Разворачивает один рецепт: база, вариации, умолчание, пересечения. */
function growRecipe<Mark>(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  where: string,
  walk: Walk<Mark>,
): void {
  const names = Object.keys(recipe.variants ?? {});

  if (names.length > 0 && recipe.defaultVariant === undefined) {
    walk.flaws.add(
      "default-missing",
      where,
      "вариации объявлены, а умолчание нет. Тогда «главная» и «атрибут не указан» — два разных " +
        "адреса, совпадающие по договорённости, которой нет ни в одном файле",
    );
  }

  if (recipe.defaultVariant !== undefined && !names.includes(recipe.defaultVariant)) {
    walk.flaws.add(
      "unknown-variant",
      `${where}.defaultVariant`,
      `умолчание называет вариацию «${recipe.defaultVariant}», которой в рецепте нет`,
    );
  }

  if (recipe.base) {
    growParts(passport, ANY_VARIANT, 0, recipe.base, `${where}.base`, walk);
  }

  for (const [name, parts] of Object.entries(recipe.variants ?? {})) {
    const at = `${where}.variants.${name}`;

    if (!safeName(name)) {
      walk.flaws.add("unsafe-name", at, `имя вариации «${name}» не годится внутрь селектора`);
      continue;
    }

    const selector = variantSelector(passport, name, name === recipe.defaultVariant);

    if (selector === undefined) {
      walk.flaws.add(
        "variant-unaddressable",
        at,
        `ось вариаций компонента «${passport.component}» выражена не атрибутом — имя вариации ` +
          "в разметку не попадает, и адресовать его нечем",
      );
      continue;
    }

    growParts(passport, { selector, names: [name] }, 1, parts, at, walk);
  }

  for (const [index, compound] of (recipe.compoundVariants ?? []).entries()) {
    growCompound(passport, recipe, compound, `${where}.compoundVariants[${index}]`, walk);
  }
}

/** Разворачивает одно пересечение: перечисленные вариации и состояния — в один адрес. */
function growCompound<Mark>(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  compound: CompoundVariant,
  where: string,
  walk: Walk<Mark>,
): void {
  const chosen = compound.variants ?? [];
  const unknown = chosen.filter((name) => !(name in (recipe.variants ?? {})));

  if (unknown.length > 0) {
    walk.flaws.add(
      "unknown-variant",
      where,
      `пересечение называет вариации, которых в рецепте нет: ${unknown.join(", ")}`,
    );
    return;
  }

  // Перечень имён — это «одна ИЗ них», и `:is()` выражает ровно это, не удваивая правило на
  // каждое имя. Доводы всех названных вариаций складываются в ОДИН уровень скобок: вес от этого
  // не меняется (все доводы одного веса), а читать порождённый файл человеку.
  const options = chosen.flatMap(
    (name) => variantAlternatives(passport, name, name === recipe.defaultVariant) ?? [undefined],
  );

  if (options.some((option) => option === undefined)) {
    walk.flaws.add(
      "variant-unaddressable",
      where,
      `ось вариаций компонента «${passport.component}» выражена не атрибутом`,
    );
    return;
  }

  const variant = anyOf(options as string[])!;

  // Состояния пересечения — те же координаты, что и вложенные: разворачиваем их тем же обходом,
  // обернув вид в цепочку `states`, вместо второй реализации той же работы.
  const wrapped: PartStyles = Object.fromEntries(
    Object.entries(compound.style).map(([part, style]) => [
      part,
      (compound.states ?? []).reduceRight<PartStyle>(
        (inner, state) => ({ states: { [state]: inner } }),
        style,
      ),
    ]),
  );

  growParts(passport, { selector: variant, names: chosen }, 2, wrapped, where, walk);
}

/** Ставит правила в порядок каскада: больше условий — позже; при равенстве — по происхождению. */
function ordered<R extends CssRule>(rules: R[]): R[] {
  return rules
    .map((rule, index) => ({ rule, index }))
    .sort(
      (a, b) =>
        a.rule.conditions - b.rule.conditions ||
        a.rule.origin - b.rule.origin ||
        a.index - b.index,
    )
    .map((entry) => entry.rule);
}

/**
 * Собирает правила скина — единственный обход рецептов в зоне.
 *
 * @param skin скин целиком
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 * @returns правила в порядке каскада — каждое со своим адресом — и все изъяны сразу
 */
export function skinRules(
  skin: Skin,
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): SkinRules {
  const done = trace(`skinRules(${skin.name})`);

  const known = vocabularyOf(skin, vocabulary);
  const flaws = new Flaws();
  const out: SkinRule[] = [];
  const walk: Walk<{ coordinate: RuleCoordinate }> = {
    lookup,
    known,
    // Спрашиваем ровно те компоненты, которые одевает сам скин: предел назван в `variables.ts` —
    // переменную компонента, которого в скине нет, механика зовёт необъявленной, и это верный
    // ответ для неё.
    homes: variableHomes(lookup, Object.keys(skin.recipes)),
    flaws,
    out,
    mark: coordinateOf,
  };

  if (!safeName(skin.name)) {
    flaws.add("unsafe-name", "name", `имя скина «${skin.name}» не годится внутрь селектора`);
  }

  // Семя, из которого лестницу не построить, — изъян ЗАПИСИ, а не поломка счёта. Проверяется до
  // всего остального: следом за негодным семенем в перечень посыплются ссылки на его ступени, и
  // причину надо назвать первой.
  for (const bad of seedRefusals(skin.variables)) {
    flaws.add(
      "bad-seed",
      `variables.scales.${bad.scale}`,
      `${bad.means}. Из такого семени лестница не строится, и ступени шкалы «${bad.scale}» ` +
        "объявленными не считаются",
    );
  }

  // Размерный набор — тот же род изъяна и та же причина назвать его ПЕРВЫМ: следом за
  // непосеянной шкалой в перечень посыплются ссылки на её ступени.
  for (const bad of sizeRefusals(skin.variables)) {
    flaws.add("bad-size", `variables.dimensions.${bad.seed}`, bad.means);
  }

  // Переменные — половина скина, и значение в них такое же значение: ссылка на несуществующее
  // имя проезжает оттуда ровно так же молча.
  for (const half of ["light", "dark"] as const) {
    for (const [name, value] of Object.entries(skin.variables?.[half] ?? {})) {
      const at = `variables.${half}.${name}`;
      if (!safeName(name)) flaws.add("unsafe-name", at, `имя «${name}» не годится в CSS`);
      else checkValue(value, at, known, flaws);
    }
  }

  for (const [component, recipe] of Object.entries(skin.recipes)) {
    const passport = lookup(component);
    const where = `recipes.${component}`;

    if (!passport) {
      flaws.add(
        "unknown-component",
        where,
        `паспорта компонента «${component}» нет: ни частей, ни состояний, ни оси вариаций ` +
          "прочитать неоткуда",
      );
      continue;
    }

    growRecipe(passport, recipe, where, walk);
  }

  for (const [name, frames] of Object.entries(skin.keyframes ?? {})) {
    if (!safeName(name)) {
      flaws.add("unsafe-name", `keyframes.${name}`, "имя движения не годится в CSS");
      continue;
    }
    checkKeyframes(frames, `keyframes.${name}`, known, flaws);
  }

  done();
  return { rules: ordered(out), flaws: flaws.list };
}

/**
 * Собирает правила ПРАВОК ОБРАЗЦА — вторая область адреса, тем же обходом.
 *
 * Отдельный вызов, а не отбор внутри общего: разрез между скином и правками образца обязан быть
 * МАШИННЫМ. Пока он держится фильтром, правки образца рано или поздно уедут в файл скина, и
 * приложение получит вид, привязанный к идентификаторам чужого стенда. Здесь утечь нечему:
 * скин на вход этой функции не приходит вовсе.
 *
 * Адреса у этих правил НЕТ, и в ответе его нет: правка образца одевает ОДНО МЕСТО, а не
 * координату. Припиши мы ей координату — покрытие и читаемость увидели бы одетой ту, которой
 * вида не давали, а покрашен один узел чужого стенда.
 *
 * @param edits правки по узлам
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 */
export function sketchRules(
  edits: readonly SketchEdit[],
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): SketchRules {
  const done = trace(`sketchRules(${edits.length})`);

  const known = vocabularyOf(undefined, vocabulary);
  const flaws = new Flaws();
  const out: CssRule[] = [];
  // Подпись пустая: обход у нас общий, а адреса у правки образца нет. Отдельная ветка обхода
  // стоила бы второй реализации разворота рецепта ради одного поля.
  const walk: Walk<Record<never, never>> = {
    lookup,
    known,
    homes: variableHomes(lookup, edits.map((edit) => edit.component)),
    flaws,
    out,
    mark: () => ({}),
  };

  for (const [index, edit] of edits.entries()) {
    const where = `edits[${index}]`;
    const passport = lookup(edit.component);

    if (!passport) {
      flaws.add("unknown-component", where, `паспорта компонента «${edit.component}» нет`);
      continue;
    }

    if (!safeName(edit.node)) {
      flaws.add("unsafe-name", where, `имя узла «${edit.node}» не годится внутрь селектора`);
      continue;
    }

    if (partSelector(passport, edit.part) === undefined) {
      flaws.add(
        "unknown-part",
        where,
        `компонент «${edit.component}» части «${edit.part}» не объявлял`,
      );
      continue;
    }

    // Адрес — ТОЛЬКО имя узла: оно уникально в дереве, и добавлять к нему координату значило бы
    // утяжелять селектор ради вида записи. Часть при этом названа не зря — из неё читается
    // словарь состояний, без которого «этот узел при наведении» не адресуем.
    const cursor: Cursor = {
      passport,
      part: edit.part,
      // Правка образца адресует ту же ЧАСТЬ, значит и переменные ей доступны те же: у одного
      // вопроса один ответ независимо от того, координатой правило пришло или именем узла.
      known: new Set([...known, ...partVariables(passport, edit.part)]),
      own: nodeSelector(edit.node),
      prefix: "",
      variants: [],
      states: [],
      conditions: 0,
      origin: 0,
    };

    growLocal(cursor, edit.style, where, walk);

    for (const [i, ancestor] of (edit.style.ancestors ?? []).entries()) {
      growAncestor(cursor, ancestor, `${where}.ancestors[${i}]`, walk);
    }
  }

  done();
  return { rules: ordered(out), flaws: flaws.list };
}

/**
 * Изъяны скина — тот же обход, без правил.
 *
 * Нужен редактору: пока человек правит, порождать нечего, а сказать «имя такое-то неизвестно»
 * надо сразу. Отдельной реализации проверки за этим вызовом нет — она была бы второй правдой о
 * том, что в скине законно.
 *
 * @param skin скин целиком
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 */
export function checkSkin(
  skin: Skin,
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): readonly SkinFlaw[] {
  return skinRules(skin, lookup, vocabulary).flaws;
}

/**
 * Изъяны правок образца — тем же обходом.
 *
 * @param edits правки по узлам
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 */
export function checkSketch(
  edits: readonly SketchEdit[],
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): readonly SkinFlaw[] {
  return sketchRules(edits, lookup, vocabulary).flaws;
}
