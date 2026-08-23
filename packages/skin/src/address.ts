// АДРЕС → СЕЛЕКТОР. Единственное место в зоне, где рождается селектор.
//
// ## Селектор порождается, руками не пишется
//
// Координата правила — часть, состояние, вариация, предок (страница «Скин»). Ни одно из
// четырёх не превращается в селектор догадкой: часть даёт анатомия, состояние — словарь
// состояний части, ось вариаций — паспорт, предок — та же анатомия у компонента-владельца.
//
// Свободного селектора здесь нет и быть не может. Он цепляется за внутреннюю структуру разметки
// или за имя класса — и то и другое внутреннее дело компонента и меняется без предупреждения;
// скин, написанный так, ломается молча при чужом рефакторинге.
//
// ## Почему адрес части собирается из `attrs`, а не из `selector`
//
// `anatomy.build()` отдаёт на часть обе стороны: `attrs` для узла и `selector` для стиля.
// Второй — вложенная форма (`&[data-scope=…], …`), рассчитанная на вставку внутрь правила
// хозяина. Нам нужен корень правила, и собрать его из `attrs` дешевле, чем разбирать чужую
// вложенную запись.
//
// Имён атрибутов здесь при этом НЕТ: пара перебирается как есть. Добавит анатомия третий
// адресный атрибут — он приедет в селектор сам, и переписывать тут будет нечего.
//
// ## Один приём, из-за которого весь файл выглядит так, а не иначе: `:is()`
//
// Дважды подряд нужен селектор «одно ИЛИ другое» с сохранением веса:
//
//   • состояние-псевдокласс плюс принудительный признак — иначе предпросмотр не покажет
//     наведение вовсе;
//   • имя вариации плюс ОТСУТСТВИЕ имени — иначе умолчание и голый компонент станут двумя
//     разными адресами.
//
// Перечислением через запятую это стоило бы удвоения правил на каждое такое условие (три
// вложенных псевдосостояния — восемь селекторов). `:is()` берёт вес САМОГО ТЯЖЁЛОГО довода, а
// здесь все доводы одного веса — псевдокласс, атрибут и `:not([атрибут])` весят одинаково.
// Значит `:is(:hover, [data-force~="hover"])` весит ровно столько же, сколько `:hover`, и
// каскад от появления принудительного признака не сдвигается ни на единицу.

import type { ComponentPassport, PassportMark } from "@omnifield/probe-web-ui/passport";
import { partOf } from "@omnifield/probe-web-ui/passport";

import { FORCE_ATTRIBUTE, NODE_ATTRIBUTE } from "./marks.js";

/** Чем найти паспорт по имени компонента. Форма взята у читателя паспорта под вид. */
export type PassportLookup = (component: string) => ComponentPassport | undefined;

/**
 * Годится ли имя внутрь селектора.
 *
 * Имена вариаций и узлов создаёт ЧЕЛОВЕК в редакторе, и они уезжают в строковый литерал
 * атрибута. Кавычка и обратная косая там закрыли бы литерал раньше времени: получилось бы
 * другое правило, а не сломанное — то есть тихо. Проверка узкая намеренно: остальную форму
 * имени держит хранилище, и второй копии её правила мы не заводим.
 *
 * @param name имя, которое уедет в селектор
 */
export function safeName(name: string): boolean {
  return name.length > 0 && !/["\\]/.test(name);
}

/**
 * Собирает читатель паспортов из перечня.
 *
 * Перечень компонентов приходит СНАРУЖИ — он принадлежит реестру, — а обходу нужен вызов по
 * имени. Место сборки одно, чтобы каждый читатель перечня не заводил свою карту.
 *
 * Наружу отдаётся ТЕМ ЖЕ входом, что и тип `PassportLookup` (`PWEB-95`): половина механики просит
 * читатель, половина — перечень, и без выведенной сборки держатель перечня обязан был написать
 * свою карту, то есть сделать ровно то, против чего написан абзац выше.
 *
 * ```ts
 * import { PASSPORTS } from "@omnifield/probe-web-ui/passport";
 * import { passportLookup, withPassports } from "@omnifield/probe-web-skin";
 *
 * const { assemble, generateSkinCss } = withPassports(passportLookup(Object.values(PASSPORTS)));
 * ```
 *
 * @param passports паспорта, которые считаются известными
 */
export function passportLookup(
  passports: Iterable<ComponentPassport>,
): PassportLookup {
  const byName = new Map<string, ComponentPassport>();
  for (const passport of passports) byName.set(passport.component, passport);

  return (component) => byName.get(component);
}

/** Селектор атрибута: с ожидаемым значением или на само наличие. */
function attribute(name: string, value?: string): string {
  return value === undefined ? `[${name}]` : `[${name}="${value}"]`;
}

/**
 * Селектор ЧАСТИ — пара адресных атрибутов из анатомии.
 *
 * @param passport паспорт компонента
 * @param part имя части — ключ анатомии
 * @returns селектор, либо `undefined` — если такой части компонент не объявлял
 */
export function partSelector(passport: ComponentPassport, part: string): string | undefined {
  const attrs = passport.anatomy.build()[part]?.attrs;
  if (!attrs) return undefined;

  return Object.entries(attrs)
    .map(([name, value]) => attribute(name, value))
    .join("");
}

/**
 * Селектор КОМПОНЕНТА ЦЕЛИКОМ — без части.
 *
 * Нужен точечным правкам наряда: правка принадлежит компоненту, а не его части, и переопределяет
 * роль для всего его поддерева наследованием.
 *
 * Признак ВЫВОДИТСЯ из того, что отдал кит, а не зашивается: у корневой части берётся тот
 * атрибут, чьё значение равно имени компонента, — это и есть признак рода, общий для всех частей.
 * Зашей мы здесь `data-scope`, у нас появилась бы третья копия чужого имени (`marks.ts` держит
 * две и называет это пробелом вслух) — и правка молча перестала бы попадать после переименования.
 *
 * @param passport паспорт компонента
 * @returns селектор компонента, либо `undefined` — если признак рода не выводится
 */
export function componentSelector(passport: ComponentPassport): string | undefined {
  const attrs = passport.anatomy.build()[passport.root]?.attrs;
  if (!attrs) return undefined;

  const пара = Object.entries(attrs).find(([, value]) => value === passport.component);

  return пара ? attribute(пара[0], пара[1]) : undefined;
}

/**
 * Селектор одного СОСТОЯНИЯ по тому, чем оно выражено в разметке.
 *
 * Псевдокласс получает пару с принудительным признаком, атрибут — нет, и это не
 * непоследовательность, а честность. Атрибутное состояние редактор выставляет НАСТОЯЩИМ
 * атрибутом и получает НАСТОЯЩЕЕ правило: подменять его признаком значило бы показывать человеку
 * не то, что он одевает. Псевдокласс так выставить нельзя вообще — только там пара и нужна.
 *
 * @param state имя состояния — оно же токен принудительного признака
 * @param mark чем состояние выражено в разметке
 */
export function markSelector(state: string, mark: PassportMark): string {
  if (mark.kind === "attribute") return attribute(mark.name, mark.value);

  return `:is(${mark.name}, [${FORCE_ATTRIBUTE}~="${state}"])`;
}

/**
 * Селектор состояния ЧАСТИ.
 *
 * @param passport паспорт компонента
 * @param part имя части
 * @param state имя состояния
 * @returns селектор, либо `undefined` — если часть такого состояния не объявляла
 */
export function stateSelector(
  passport: ComponentPassport,
  part: string,
  state: string,
): string | undefined {
  const mark = partOf(passport, part)?.states.find((declared) => declared.name === state)?.mark;

  return mark === undefined ? undefined : markSelector(state, mark);
}

/**
 * Селектор ВАРИАЦИИ.
 *
 * Умолчание получает пару с отсутствием атрибута: голый компонент и компонент с явным именем —
 * ОДИН адрес, а не два (заметка к `PWEB-2`). Вес при этом не меняется — оба довода в `:is()`
 * весят одинаково, поэтому умолчание не начинает перебивать остальные вариации.
 *
 * @param passport паспорт компонента
 * @param variant имя вариации
 * @param isDefault действует ли эта вариация при отсутствии атрибута
 * @returns селектор, либо `undefined` — если ось вариаций выражена не атрибутом
 */
export function variantSelector(
  passport: ComponentPassport,
  variant: string,
  isDefault: boolean,
): string | undefined {
  return anyOf(variantAlternatives(passport, variant, isDefault));
}

/**
 * ДОВОДЫ вариации по отдельности — то, из чего складывается её селектор.
 *
 * Нужны пересечению: оно перечисляет несколько имён сразу, и сложи оно готовые селекторы — у
 * умолчания получился бы `:is()` внутри `:is()`. Работает и так, но читать порождённый файл
 * человеку, а лишний уровень скобок ничего не объясняет.
 *
 * @returns доводы, либо `undefined` — если ось вариаций выражена не атрибутом
 */
export function variantAlternatives(
  passport: ComponentPassport,
  variant: string,
  isDefault: boolean,
): string[] | undefined {
  const mark = passport.variantAxis.mark;
  // Имя вариации пишет потребитель в разметке, а псевдоклассы ставит браузер — осью вариаций
  // псевдокласс быть не может. Читатель паспорта под вид исходит из того же.
  if (mark.kind !== "attribute") return undefined;

  const named = attribute(mark.name, variant);

  return isDefault ? [named, `:not([${mark.name}])`] : [named];
}

/**
 * Складывает доводы в один селектор: один — как есть, несколько — через `:is()`.
 *
 * @param options доводы; `undefined` пробрасывается наружу как «адресовать нечем»
 */
export function anyOf(options: readonly string[] | undefined): string | undefined {
  if (options === undefined) return undefined;
  if (options.length === 0) return "";

  return options.length === 1 ? options[0]! : `:is(${options.join(", ")})`;
}

/** Селектор УЗЛА — вторая область адреса: одно место, а не координата. */
export function nodeSelector(node: string): string {
  return attribute(NODE_ATTRIBUTE, node);
}

/**
 * Селектор ПРЕДКА вместе с его состояниями — то, что встаёт слева от селектора части.
 *
 * @param passport паспорт компонента-владельца
 * @param part часть-владелец
 * @param states состояния предка
 * @returns селектор, либо `undefined` — если часть или состояние не объявлены
 */
export function ancestorSelector(
  passport: ComponentPassport,
  part: string,
  states: readonly string[] = [],
): string | undefined {
  const own = partSelector(passport, part);
  if (own === undefined) return undefined;

  let selector = own;
  for (const state of states) {
    const mark = stateSelector(passport, part, state);
    if (mark === undefined) return undefined;
    selector += mark;
  }

  return selector;
}
