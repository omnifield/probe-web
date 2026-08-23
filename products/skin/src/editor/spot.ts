// МЕСТО ПРАВКИ — координата внутри рецепта, и чтение-запись по ней.
//
// ## Одна координата на всех
//
// Витрина отбирает случаи по координате (часть · вариация · состояние), скин адресует ею же
// правило в CSS, а редактор ею же правит запись. Это НЕ совпадение, которое надо поддерживать
// руками, — это одно понятие, выраженное один раз.
//
// Заведи редактор свой способ адресации («выбранный узел», «текущий блок»), и человек правил бы
// одно, а видел другое: узел — не координата, и два разных узла одной координаты одеваются
// одним правилом.
//
// ## Отсутствие вариации — это база, а не «никакая вариация»
//
// `variant: null` означает `recipe.base`: вид, действующий всегда. Именованная вариация лежит в
// `recipe.variants[имя]` и НАКЛАДЫВАЕТСЯ на базу, а не заменяет её. Поэтому пустое место в
// вариации — не «свойство не задано», а «берётся от базы», и редактор обязан показывать это
// разницей, а не пустотой (см. `inherited`).

import type {
  LocalStyle,
  PartStyle,
  PartStyles,
  SlotRecipe,
  StyleValue,
} from "@omnifield/probe-web-skin/model";

/** Координата правки: где именно в рецепте лежит то, что человек сейчас меняет. */
export interface Spot {
  /** Часть компонента — имя из анатомии. */
  readonly part: string;
  /** Вариация; `null` — база, то есть вид, действующий всегда. */
  readonly variant: string | null;
  /** Состояние части; `null` — обычный вид, без единого признака. */
  readonly state: string | null;
}

/** Пусто ли — объект без единого ключа. Пустые ветки в записи не оставляем. */
const empty = (value: object | undefined): boolean =>
  value === undefined || Object.keys(value).length === 0;

/** Вид частей на координате вариации: база либо именованная вариация. */
function partsOfVariant(recipe: SlotRecipe, variant: string | null): PartStyles | undefined {
  return variant === null ? recipe.base : recipe.variants?.[variant];
}

/**
 * Свойства, ОБЪЯВЛЕННЫЕ на координате. Пусто — на ней не объявлено ничего.
 *
 * Именно объявленные, а не действующие: действующий вид складывается из базы, вариации и
 * состояния, и показывать эту сумму как содержимое поля значило бы предлагать человеку править
 * то, чего в этой координате нет.
 *
 * @param recipe рецепт компонента
 * @param spot координата
 */
export function styleAt(recipe: SlotRecipe, spot: Spot): Readonly<Record<string, StyleValue>> {
  const part = partsOfVariant(recipe, spot.variant)?.[spot.part];

  if (!part) return {};

  const style: LocalStyle | undefined = spot.state === null ? part : part.states?.[spot.state];

  return (style?.props ?? {}) as Readonly<Record<string, StyleValue>>;
}

/**
 * Откуда свойство берётся, если на координате его не объявлено.
 *
 * Нужно, чтобы поле «пусто» и поле «унаследовано от базы» не выглядели одинаково: первое значит
 * «никто не сказал», второе — «сказано в другом месте, и правка здесь это место перебьёт».
 *
 * @param recipe рецепт компонента
 * @param spot координата
 */
export function inherited(recipe: SlotRecipe, spot: Spot): Readonly<Record<string, StyleValue>> {
  const собранное: Record<string, StyleValue> = {};
  const свои = styleAt(recipe, spot);

  // Порядок — от общего к частному: база, база в состоянии, вариация. Тот же порядок, в котором
  // правила складываются в CSS, и другого быть не может — иначе подсказка врала бы про исход.
  const источники: Spot[] = [
    { part: spot.part, variant: null, state: null },
    ...(spot.state === null ? [] : [{ part: spot.part, variant: null, state: spot.state }]),
    ...(spot.variant === null ? [] : [{ part: spot.part, variant: spot.variant, state: null }]),
  ];

  for (const источник of источники) {
    for (const [имя, значение] of Object.entries(styleAt(recipe, источник))) {
      if (!(имя in свои)) собранное[имя] = значение;
    }
  }

  return собранное;
}

/**
 * Кладёт свойство на координату — новым рецептом, старый не трогается.
 *
 * Значение `undefined` СНИМАЕТ свойство, и вместе с ним пустые ветки: рецепт, в котором осталась
 * `states: { hover: { props: {} } }`, обещает правило, которого нет, — а обещание в записи
 * доедет до отчёта о долге и соврёт, что состояние одето.
 *
 * @param recipe рецепт компонента
 * @param spot координата
 * @param name имя свойства
 * @param value значение; `undefined` — снять
 */
export function withProp(
  recipe: SlotRecipe,
  spot: Spot,
  name: string,
  value: StyleValue | undefined,
): SlotRecipe {
  const было = partsOfVariant(recipe, spot.variant) ?? {};
  const часть = было[spot.part] ?? {};
  const цель: LocalStyle = spot.state === null ? часть : (часть.states?.[spot.state] ?? {});

  const props = { ...(цель.props ?? {}) } as Record<string, StyleValue>;
  if (value === undefined) delete props[name];
  else props[name] = value;

  const стало: LocalStyle = { ...цель };
  if (empty(props)) delete (стало as { props?: unknown }).props;
  else (стало as { props: Record<string, StyleValue> }).props = props;

  const собранная: PartStyle = spot.state === null ? стало : часть;

  if (spot.state !== null) {
    const states = { ...(часть.states ?? {}) };
    if (empty(стало)) delete states[spot.state];
    else states[spot.state] = стало;

    if (empty(states)) delete (собранная as { states?: unknown }).states;
    else (собранная as { states: Record<string, LocalStyle> }).states = states;
  }

  const части = { ...было };
  if (empty(собранная)) delete части[spot.part];
  else части[spot.part] = собранная;

  if (spot.variant === null) {
    const рецепт = { ...recipe, base: части };
    if (empty(части)) delete (рецепт as { base?: unknown }).base;
    return рецепт;
  }

  const вариации = { ...(recipe.variants ?? {}) };
  // Вариация без единого свойства ОСТАЁТСЯ: имя вариации — решение человека, а не следствие
  // того, что он успел в ней написать. Сотри мы её на последнем снятом свойстве, исчезло бы имя,
  // на которое уже ссылается разметка приложения.
  вариации[spot.variant] = части;

  return { ...recipe, variants: вариации };
}
