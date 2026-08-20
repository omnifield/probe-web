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
 *  • `unknown-value`       — ссылка на значение, которого нет в словаре, и без запасного;
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
  | "unknown-value"
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
export interface SkinRule {
  /** Полный селектор — порождён из координаты, руками не написан. */
  readonly selector: string;
  /** Вид: свойства и разрешённые вложенные блоки. */
  readonly style: StyleObject;
  /** Число условий адреса — им задаётся порядок при равном весе селектора. */
  readonly conditions: number;
  /** Происхождение: 0 база, 1 вариация, 2 пересечение. Вторичный ключ порядка. */
  readonly origin: number;
}

/** Что вышло из обхода: правила в порядке каскада и все найденные изъяны сразу. */
export interface RuleSet {
  readonly rules: readonly SkinRule[];
  readonly flaws: readonly SkinFlaw[];
}

/**
 * КООРДИНАТЫ, КОТОРЫХ КОСНУЛСЯ СКИН, — сырьё для ответа «чего он ещё не одел».
 *
 * Ключами, а не вложенными картами: сравнение идёт по принадлежности, и один плоский набор здесь
 * и дешевле, и короче читается. Пишутся ключи ОДНИМ местом (`partKey`, `stateKey`) — два
 * начертания одного ключа разошлись бы молча, и покрытие врало бы в обе стороны.
 *
 * «Коснулся» значит «дал вид»: сюда попадает часть, получившая хоть одно правило. Часть,
 * упомянутая только как ПРЕДОК чужого правила, не попадает — вида ей не дали.
 */
export interface TouchedCoordinates {
  /** Части: ключ `partKey`. */
  readonly parts: ReadonlySet<string>;
  /** Состояния: ключ `stateKey`. */
  readonly states: ReadonlySet<string>;
}

/** Что вышло из обхода РЕЦЕПТОВ: правила, изъяны и то, чего скин коснулся. */
export interface SkinRules extends RuleSet {
  readonly touched: TouchedCoordinates;
}

/** Ключ части. Одно место записи на всю зону. */
export function partKey(component: string, part: string): string {
  return `${component}.${part}`;
}

/** Ключ состояния части. Одно место записи на всю зону. */
export function stateKey(component: string, part: string, state: string): string {
  return `${partKey(component, part)}:${state}`;
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

/** Собирает словарь: объявленное снаружи плюс собственные переменные скина. */
function vocabularyOf(skin: Pick<Skin, "variables">, vocabulary: ValueVocabulary): Set<string> {
  const known = new Set<string>();

  for (const token of vocabulary.tokens ?? []) known.add(customProperty(token));
  for (const half of [skin.variables?.light, skin.variables?.dark]) {
    for (const name of Object.keys(half ?? {})) known.add(customProperty(name));
  }

  return known;
}

/** Копилка покрытия: что обход успел одеть. */
class Touched implements TouchedCoordinates {
  readonly parts = new Set<string>();
  readonly states = new Set<string>();

  /**
   * Отмечает координату, получившую правило.
   *
   * @param component имя компонента
   * @param part имя части
   * @param states состояния СВОЕЙ части, набранные к этому правилу
   */
  mark(component: string, part: string, states: readonly string[]): void {
    this.parts.add(partKey(component, part));
    for (const state of states) this.states.add(stateKey(component, part, state));
  }
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

      checkStyle(value, at, known, flaws);
      continue;
    }

    checkValue(value, at, known, flaws);
  }
}

/**
 * Проверяет ОДНО значение.
 *
 * Вынесено отдельно, потому что читателей два: свойства правила и ступени именованного
 * движения. Форма у них разная — у движения вложенность это `from`/`to`/`50%`, а не селектор, —
 * а требование к значению одно, и второй его копии быть не должно.
 */
function checkValue(value: string | number, at: string, known: Set<string>, flaws: Flaws): void {
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

    flaws.add(
      "unknown-value",
      at,
      `имя «${name}» не объявлено ни скином, ни словарём. Браузер выбросит правило целиком, ` +
        `и чинить будут вид. Запасное значение — \`var(${name}, …)\` — снимает отказ`,
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
 */
interface Walk {
  /** Чем найти паспорт по имени компонента: нужен предку, живущему в чужом дереве. */
  readonly lookup: PassportLookup;
  /** Известные имена значений. */
  readonly known: Set<string>;
  readonly flaws: Flaws;
  readonly touched: Touched;
  readonly out: SkinRule[];
}

/** ПЕРЕМЕННОЕ: где обход сейчас находится и что уже набрал в селектор. */
interface Cursor {
  readonly passport: ComponentPassport;
  readonly part: string;
  /** Селектор части вместе с уже набранными вариацией и состояниями. */
  readonly own: string;
  /** Селектор предка, если он есть, — встаёт слева. */
  readonly prefix: string;
  /**
   * Состояния СВОЕЙ части, набранные к этому месту.
   *
   * Именно свои: состояния предка сюда не попадают. Предок в правиле — условие, а вид получает
   * наша часть, и записывать предку покрытие значило бы объявить одетым то, чему вида не дали.
   */
  readonly states: readonly string[];
  /** Число условий адреса — им задаётся порядок при равном весе селектора. */
  readonly conditions: number;
  /** Происхождение: 0 база, 1 вариация, 2 пересечение. */
  readonly origin: number;
}

/** Разворачивает вид под одним селектором: свои свойства, затем состояния части. */
function growLocal(cursor: Cursor, style: LocalStyle, where: string, walk: Walk): void {
  if (style.props && declares(style.props)) {
    checkStyle(style.props, `${where}.props`, walk.known, walk.flaws);
    walk.touched.mark(cursor.passport.component, cursor.part, cursor.states);
    walk.out.push({
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
function growAncestor(cursor: Cursor, ancestor: AncestorStyle, where: string, walk: Walk): void {
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
    { ...cursor, prefix, conditions: cursor.conditions + (ancestor.states?.length ?? 0) },
    ancestor.style,
    `${where}.style`,
    walk,
  );
}

/** Разворачивает вид одной части целиком: свой адрес и уточнения по предку. */
function growPart(
  passport: ComponentPassport,
  part: string,
  /** Селектор вариации, если правило принадлежит вариации. */
  variant: string,
  origin: number,
  style: PartStyle,
  where: string,
  walk: Walk,
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
    own: own + variant,
    prefix: "",
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
function growParts(
  passport: ComponentPassport,
  variant: string,
  origin: number,
  parts: PartStyles,
  where: string,
  walk: Walk,
): void {
  for (const [part, style] of Object.entries(parts)) {
    growPart(passport, part, variant, origin, style, `${where}.${part}`, walk);
  }
}

/** Разворачивает один рецепт: база, вариации, умолчание, пересечения. */
function growRecipe(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  where: string,
  walk: Walk,
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
    growParts(passport, "", 0, recipe.base, `${where}.base`, walk);
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

    growParts(passport, selector, 1, parts, at, walk);
  }

  for (const [index, compound] of (recipe.compoundVariants ?? []).entries()) {
    growCompound(passport, recipe, compound, `${where}.compoundVariants[${index}]`, walk);
  }
}

/** Разворачивает одно пересечение: перечисленные вариации и состояния — в один адрес. */
function growCompound(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  compound: CompoundVariant,
  where: string,
  walk: Walk,
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

  growParts(passport, variant, 2, wrapped, where, walk);
}

/** Ставит правила в порядок каскада: больше условий — позже; при равенстве — по происхождению. */
function ordered(rules: SkinRule[]): SkinRule[] {
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
 * @returns правила в порядке каскада, все изъяны сразу и то, чего скин коснулся
 */
export function skinRules(
  skin: Skin,
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): SkinRules {
  const done = trace(`skinRules(${skin.name})`);

  const known = vocabularyOf(skin, vocabulary);
  const flaws = new Flaws();
  const touched = new Touched();
  const out: SkinRule[] = [];
  const walk: Walk = { lookup, known, flaws, touched, out };

  if (!safeName(skin.name)) {
    flaws.add("unsafe-name", "name", `имя скина «${skin.name}» не годится внутрь селектора`);
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
  return { rules: ordered(out), flaws: flaws.list, touched };
}

/**
 * Собирает правила ПРАВОК ОБРАЗЦА — вторая область адреса, тем же обходом.
 *
 * Отдельный вызов, а не отбор внутри общего: разрез между скином и правками образца обязан быть
 * МАШИННЫМ. Пока он держится фильтром, правки образца рано или поздно уедут в файл скина, и
 * приложение получит вид, привязанный к идентификаторам чужого стенда. Здесь утечь нечему:
 * скин на вход этой функции не приходит вовсе.
 *
 * Покрытия этот вызов НЕ считает, и в его ответе его нет: правка образца одевает ОДНО МЕСТО, а
 * не координату. Зачти мы её в покрытие — скин выглядел бы одетым там, где на самом деле покрашен
 * один узел чужого стенда.
 *
 * @param edits правки по узлам
 * @param lookup чем найти паспорт по имени компонента
 * @param vocabulary словарь известных имён значений
 */
export function sketchRules(
  edits: readonly SketchEdit[],
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): RuleSet {
  const done = trace(`sketchRules(${edits.length})`);

  const known = vocabularyOf({}, vocabulary);
  const flaws = new Flaws();
  const out: SkinRule[] = [];
  // Копилка покрытия заведена и выброшена: обход у нас общий, а зачитывать правку образца в
  // покрытие нельзя. Отдельная ветка обхода стоила бы второй реализации ради одного `if`.
  const walk: Walk = { lookup, known, flaws, touched: new Touched(), out };

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
      own: nodeSelector(edit.node),
      prefix: "",
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
