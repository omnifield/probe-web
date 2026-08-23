// СЛУЧАЙ — компонент в условии, ради которого на него стоит смотреть (`PWEB-31`).
//
// ## Случаи порождаются ОСЯМИ, и только ими
//
// Витрина показывает вид: вариации компонента и состояния, в которых он бывает. Всё это —
// координаты, и случай на витрине это координата, поставленная в разметку.
//
// Случаев, названных рукой («длинная подпись», «в узком месте»), здесь НЕТ. Они не координаты:
// длина содержимого не вариация и не состояние, и в потоке вариаций такая карточка отвечает не на
// тот вопрос, с которым сюда приходят. Их место — раздел проверок в редакторе (решение user
// 2026-08-23), и заводить их обратно на витрину нельзя.
//
// ## Дерево случая порождается, а не верстается
//
// Каждый случай начинается с ОБРАЗЦА (`sketchOf`) — дерева частей, выведенного из анатомии
// компонента. Условие накладывается правкой через механику (`updateNode`), а не подстановкой
// полей руками.
//
// Причина ровно та, ради которой витрина вообще строится на механике: свёрстанный руками случай
// проверяет вёрстку случая. Порождённый — проверяет механику, паспорт и скин разом.
//
// ## Состояние ставится на УЗЕЛ ЧАСТИ, а не только на корень
//
// У крупного компонента состояния живут на вложенных частях: наведение на строке таблицы, фокус
// на ячейке. Образец даёт все узлы, и признак ставится на тот, чья часть выбрана. Иначе показать
// вид вложенной части было бы нечем, а её долг одевания — невидим.

import {
  insertNode,
  isContent,
  sketchOf,
  updateNode,
  type AssemblyTree,
} from "@omnifield/probe-web-assembly";
import { FORCE_ATTRIBUTE } from "@omnifield/probe-web-skin/model";
import {
  passportOf,
  type PassportMark,
  type PassportState,
} from "@omnifield/probe-web-ui/passport";

import { REGISTRY } from "./registry.js";

/**
 * Ось «ВСЕ» — положение, при котором ось не фиксируется, а разворачивается в поток случаев.
 *
 * Отдельным значением, а не `null` и не отсутствием поля, ровно потому, что «все» и «обычное» —
 * РАЗНЫЕ положения одной оси, и раньше они были склеены. Склейка стоила стартового вида: человек
 * приходил смотреть вариации, а получал их произведение на состояния, и обычный вид кнопки —
 * тот, ради которого он и пришёл, — лежал вперемешку с наведёнными и отключёнными.
 */
export const ANY = "*";

/** Положение оси: названное значение либо «все». */
export type Axis<T> = T | typeof ANY;

/** Координата случая — где он стоит по осям. */
export interface CaseAt {
  /** Часть, к которой случай относится. Не названа — корневая. */
  readonly part?: string;
  /** Вариация; `null` — умолчание, то есть атрибут не поставлен. */
  readonly variant: string | null;
  /** Состояние; `null` — обычное. */
  readonly state: string | null;
}

/** Один случай: компонент, поставленный в координату. */
export interface ShowcaseCase {
  readonly id: string;
  /** Чем условие названо — координатой, из которой случай и порождён. */
  readonly title: string;
  /** Зачем случай показан. Случай без повода не показывают. */
  readonly note: string;
  /** Где случай стоит по осям — по этому его и отбирает фильтр. */
  readonly at: CaseAt;
  /** Дерево случая: образец компонента плюс условие. */
  readonly tree: AssemblyTree;
}

/** Срез осей: что развернуть, а что зафиксировать. */
export interface Slice {
  /** Часть, чьё состояние показываем. Не названа — корневая. */
  readonly part?: string;
  /** Вариация: имя либо {@link ANY} — развернуть по всем. */
  readonly variant: Axis<string>;
  /**
   * Состояние: имя, `null` — ОБЫЧНОЕ (ни одного признака не поставлено), либо {@link ANY}.
   *
   * Три положения, а не два: обычный вид — полноправный выбор, а не «фильтр не задан». С него
   * показ и начинается, потому что всё остальное — отклонения от него.
   */
  readonly state: Axis<string | null>;
  /** Имена вариаций надетого скина — оси взять больше неоткуда. */
  readonly variants: readonly string[];
}

/**
 * Как выставить состояние В РАЗМЕТКЕ — по тому, чем его объявил паспорт.
 *
 * Атрибутные состояния ставятся атрибутом, псевдоклассовые — признаком принуждения. Это показ
 * ВИДА, а не проверка поведения: что кит действительно ставит `data-disabled` от своего пропа,
 * проверяют его собственные пробы, и повторять их здесь нечем и незачем.
 *
 * Знание о том, каким пропом включается состояние, паспорту не принадлежит: он объявляет
 * наблюдаемую поверхность для вида, а не сигнатуру вызова. Поэтому витрина идёт от разметки —
 * ровно оттуда же, откуда идёт скин.
 */
function stateProps(mark: PassportMark): Record<string, unknown> {
  return mark.kind === "pseudo"
    ? { [FORCE_ATTRIBUTE]: mark.name.replace(/^:/, "") }
    : { [mark.name]: mark.value ?? "" };
}

/** Адрес узла части в дереве образца: корневая часть и компонент целиком — одно место. */
export function addressOfPart(component: string, part: string): string {
  return passportOf(component)?.root === part ? component : `${component}.${part}`;
}

/** Состояния части — из паспорта. Часть без добавки состояний не объявляла: перечень пуст. */
export function statesOfPart(component: string, part: string): readonly PassportState[] {
  return passportOf(component)?.parts.find((item) => item.name === part)?.states ?? [];
}

/** Части компонента — из анатомии: она источник, добавка паспорта лишь приписка к ней. */
export function partsOf(component: string): readonly string[] {
  return passportOf(component)?.anatomy.keys() ?? [];
}

/** Корневая часть компонента — с неё начинается дерево, на неё смотрят по умолчанию. */
export function rootPartOf(component: string): string {
  return passportOf(component)?.root ?? "";
}

/**
 * Узел образца по адресу части, либо `undefined` — если такой части в образце нет.
 *
 * Узлы СОДЕРЖИМОГО пропускаются: адреса у них нет вовсе — они опознаются родом, — и состояние на
 * подпись не ставится, потому что подпись не часть.
 */
function nodeOfPart(tree: AssemblyTree, address: string): string | undefined {
  return Object.values(tree.components.nodes).find(
    (node) => !isContent(node) && node.type === address,
  )?.id;
}

/**
 * ПОДПИСЬ ОБРАЗЦА — чем наполняется компонент на витрине.
 *
 * Содержимое кладёт ПОТРЕБИТЕЛЬ, а не кит и не скин: паспорт лишь объявляет, что внутрь пускают
 * текст. Витрина здесь и есть потребитель, поэтому подпись её — но живёт она перечнем, а не
 * зашита в сборку случая: у гармошки подписей несколько и они разные, у кнопки одна.
 */
const ПОДПИСИ: Readonly<Record<string, string>> = {
  button: "Кнопка",
};

/**
 * Собирает случай: образец плюс условие. Вариация ложится на корень, состояние — на узел
 * выбранной части, подпись — отдельным УЗЛОМ СОДЕРЖИМОГО.
 *
 * Узлом, а не пропом: у части, принимающей и текст, и вложенную часть, порядок между ними иначе
 * не выразить, и механика отрисовки props.children у такого узла не рисует вовсе.
 *
 * Отказ механики — **исключение**, а не значение, и это единственное такое место в зоне: отказ
 * означает, что случай написан против паспорта, то есть дефект нашей записи, а не состояние
 * данных. Молча показать вместо него пустое место значило бы спрятать его от себя же.
 */
function build(
  component: string,
  rootProps: Readonly<Record<string, unknown>>,
  partAddress?: string,
  stateMark?: PassportMark,
): AssemblyTree {
  const sketch = sketchOf(REGISTRY, component);

  if (!sketch) {
    throw new Error(`витрина: компонента «${component}» нет в реестре — случай собрать не из чего`);
  }

  const root = sketch.components.root;
  const onRoot = updateNode(sketch, root, { props: rootProps });

  if (!onRoot.ok) throw new Error(`витрина: случай отвергнут механикой — ${onRoot.means}`);

  const подпись = ПОДПИСИ[component];
  const наполнено =
    подпись === undefined
      ? onRoot
      : insertNode(onRoot.tree, REGISTRY, { id: "подпись", genus: "text", value: подпись }, root);

  if (!наполнено.ok) throw new Error(`витрина: подпись не легла — ${наполнено.means}`);
  if (stateMark === undefined || partAddress === undefined) return наполнено.tree;

  const target = nodeOfPart(наполнено.tree, partAddress);

  // Части нет в образце — состояние не ставим и молчим: это законно, часть могла не попасть в
  // образец. Отказывать здесь значило бы ронять показ из-за выбора оси.
  if (target === undefined) return наполнено.tree;

  const props = target === root ? { ...rootProps, ...stateProps(stateMark) } : stateProps(stateMark);
  const onPart = updateNode(наполнено.tree, target, { props });

  if (!onPart.ok) throw new Error(`витрина: состояние не легло на часть — ${onPart.means}`);

  return onPart.tree;
}

/**
 * Случаи, порождённые ОСЯМИ: вариация × состояние выбранной части.
 *
 * Ось в положении «все» разворачивается, названная — фиксируется. Так один и тот же показ годится
 * и кнопке (десятки мелких случаев), и крупному компоненту (несколько больших): что разворачивать,
 * решает человек, а не наше представление о его размере.
 *
 * Первая вариация — БЕЗ имени: умолчание скина и «атрибут не поставлен» это один адрес, и
 * показывать его надо тем, чем он является.
 *
 * @param component адрес компонента в реестре
 * @param slice срез осей
 */
export function axisCases(component: string, slice: Slice): ShowcaseCase[] {
  const passport = passportOf(component);

  if (!passport) return [];

  const part = slice.part ?? passport.root;
  const address = addressOfPart(component, part);
  const axis = passport.variantAxis.mark;

  // УМОЛЧАНИЯ ОТДЕЛЬНОЙ СТРОКОЙ НЕТ. Скин объявляет умолчание именем, и «атрибут не поставлен»
  // — тот же адрес, что названная умолчательная вариация. Показывать их порознь значило бы
  // обещать два разных вида там, где вид один.
  // БЕЗ ВАРИАЦИЙ — ОДИН СЛУЧАЙ, А НЕ НИ ОДНОГО. Имена вариаций приходят из надетого наряда, и
  // пока он не надет, их нет вовсе. Пустой поток читался бы как поломка витрины, тогда как
  // показывать есть что: голого кита. «Без вариации» — законная координата, а не заглушка.
  const named = slice.variants.length > 0 ? slice.variants : [null];
  const variants: readonly (string | null)[] = slice.variant === ANY ? named : [slice.variant];

  const states = statesOfPart(component, part);

  // ОБЫЧНОЕ — это `undefined` в перечне: признака не ставится ни одного. Оно идёт ПЕРВЫМ и в
  // положении «все», потому что состояния читаются как отклонения от обычного вида, а отклонение
  // показывать раньше того, от чего оно отклоняется, — значит показывать его без опоры.
  const shown =
    slice.state === ANY
      ? [undefined, ...states]
      : slice.state === null
        ? [undefined]
        : states.filter((state) => state.name === slice.state);

  const cases: ShowcaseCase[] = [];

  for (const variant of variants) {
    const variantProps =
      variant === null || axis.kind !== "attribute" ? {} : { [axis.name]: variant };

    for (const state of shown) {
      cases.push({
        id: `axis:${variant ?? "-"}:${part}:${state?.name ?? "-"}`,
        title: [variant ?? "без вариации", part, state?.name ?? "обычное"].join(" · "),
        note: state?.means ?? "вид без состояния — то, с чего начинается всё остальное",
        at: { part, variant, state: state?.name ?? null },
        tree: build(component, variantProps, address, state?.mark),
      });
    }
  }

  return cases;
}

/**
 * Показ компонента: случаи текущего среза.
 *
 * Отдельного входа сверх осей нет намеренно — см. шапку: витрина показывает координаты, и второй
 * род случаев рядом с ними отвечал бы не на тот вопрос.
 *
 * @param component адрес компонента в реестре
 * @param slice срез осей
 */
export function casesOf(component: string, slice: Slice): ShowcaseCase[] {
  return axisCases(component, slice);
}
