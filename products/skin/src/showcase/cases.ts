// СЛУЧАЙ — компонент в условии, ради которого на него стоит смотреть (`PWEB-31`).
//
// ## Единица показа одна
//
// И порождённое осями, и названное человеком — ОДИН И ТОТ ЖЕ случай: компонент, поставленный в
// условие, и подпись, которая это условие называет. Разница лишь в том, кто условие назвал.
//
// Прежде их было два блока — «вариации и состояния» таблицей и «случаи» карточками. Таблица
// задавала компоненту размер клетки: кнопка влезала, крупный компонент нет, — и ось состояний
// строилась по корневой части, поэтому состояния вложенных частей не показывались вовсе. Оба
// изъяна снимаются одним ходом: единица одна, а оси становятся ФИЛЬТРОМ, а не раскладкой.
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

import { sketchOf, updateNode, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { FORCE_ATTRIBUTE } from "@omnifield/probe-web-skin/model";
import {
  passportOf,
  type PassportMark,
  type PassportState,
} from "@omnifield/probe-web-ui/passport";

import { REGISTRY } from "./registry.js";

/**
 * Координата случая — где он стоит по осям.
 *
 * Есть у КАЖДОГО случая, включая человеческий: «занята» это состояние `busy`, «длинная подпись» —
 * умолчание без состояния. Без неё фильтр к человеческим случаям не применялся бы, и они висели
 * бы в потоке при любом срезе — а это читается как «фильтр не работает».
 */
export interface CaseAt {
  /** Часть, к которой случай относится. Не названа — корневая. */
  readonly part?: string;
  /** Вариация; `null` — умолчание, то есть атрибут не поставлен. */
  readonly variant: string | null;
  /** Состояние; `null` — обычное. */
  readonly state: string | null;
}

/** Один случай: компонент в названном условии. */
export interface ShowcaseCase {
  readonly id: string;
  /** Чем условие названо: координата для порождённых, имя случая для человеческих. */
  readonly title: string;
  /** Зачем случай показан. Случай без повода не показывают. */
  readonly note: string;
  /** Кто назвал условие: ось или человек. Это разные обещания, и подпись их различает. */
  readonly origin: "axis" | "human";
  /** Где случай стоит по осям — по этому его и отбирает фильтр. */
  readonly at: CaseAt;
  /** Дерево случая: образец компонента плюс условие. */
  readonly tree: AssemblyTree;
}

/** Срез осей: что развернуть, а что зафиксировать. */
export interface Slice {
  /** Часть, чьё состояние показываем. Не названа — корневая. */
  readonly part?: string;
  /** Имя вариации; `null` — развернуть по всем, включая умолчание. */
  readonly variant?: string | null;
  /** Имя состояния; `null` — развернуть по всем, включая обычное. */
  readonly state?: string | null;
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

/** Узел образца по адресу части, либо `undefined` — если такой части в образце нет. */
function nodeOfPart(tree: AssemblyTree, address: string): string | undefined {
  return Object.values(tree.components.nodes).find((node) => node.type === address)?.id;
}

/**
 * Собирает случай: образец плюс условие. Вариация и содержимое ложатся на корень, состояние — на
 * узел выбранной части.
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
  if (stateMark === undefined || partAddress === undefined) return onRoot.tree;

  const target = nodeOfPart(onRoot.tree, partAddress);

  // Части нет в образце — состояние не ставим и молчим: это законно, часть могла не попасть в
  // образец (содержимое потребителя механика внутрь не кладёт). Отказывать здесь значило бы
  // ронять показ из-за выбора оси.
  if (target === undefined) return onRoot.tree;

  const props = target === root ? { ...rootProps, ...stateProps(stateMark) } : stateProps(stateMark);
  const onPart = updateNode(onRoot.tree, target, { props });

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

  const variants =
    slice.variant === undefined || slice.variant === null
      ? [null, ...slice.variants]
      : [slice.variant];

  const states = statesOfPart(component, part);
  const shown =
    slice.state === undefined || slice.state === null
      ? [undefined, ...states]
      : states.filter((state) => state.name === slice.state);

  const cases: ShowcaseCase[] = [];

  for (const variant of variants) {
    const variantProps =
      variant === null || axis.kind !== "attribute" ? {} : { [axis.name]: variant };

    for (const state of shown) {
      cases.push({
        id: `axis:${variant ?? "-"}:${part}:${state?.name ?? "-"}`,
        title: [variant ?? "умолчание", part, state?.name ?? "обычное"].join(" · "),
        note: state?.means ?? "вид без состояния — то, с чего начинается всё остальное",
        origin: "axis",
        at: { part, variant, state: state?.name ?? null },
        tree: build(component, { children: "Кнопка", ...variantProps }, address, state?.mark),
      });
    }
  }

  return cases;
}

/** Что накладывается на образец в человеческом случае. */
interface Condition {
  readonly id: string;
  readonly title: string;
  readonly note: string;
  /** Где случай стоит по осям. Называет ЧЕЛОВЕК: только он знает, про что его случай. */
  readonly at: CaseAt;
  readonly props: Readonly<Record<string, unknown>>;
}

/** Собирает случай, условие которого назвал человек. */
function human(component: string, condition: Condition): ShowcaseCase {
  return {
    id: `human:${condition.id}`,
    title: condition.title,
    note: condition.note,
    origin: "human",
    at: condition.at,
    tree: build(component, condition.props),
  };
}

/**
 * Случаи, названные ЧЕЛОВЕКОМ: то, чего оси не порождают.
 *
 * Оси знают вариации и состояния — то есть координаты. Всё остальное, что делает случай случаем,
 * координатами не выражается: длина подписи, собранная из готового занятость, чужое содержимое
 * внутри. Это и остаётся человеку.
 */
export const HUMAN_CASES: Readonly<Record<string, readonly ShowcaseCase[]>> = {
  button: [
    human("button", {
      id: "busy",
      title: "Занята",
      note: "работа идёт: занятость собирается из готового — отключённость плюс `aria-busy`",
      at: { variant: null, state: "busy" },
      props: { children: "Сохраняю…", disabled: true, "aria-busy": "true" },
    }),
    human("button", {
      id: "disabled-real",
      title: "Отключена по-настоящему",
      note: "не признаком, а пропом: проверяем, что кит сам ставит `data-disabled`",
      at: { variant: null, state: "disabled" },
      props: { children: "Сохранить", disabled: true },
    }),
    human("button", {
      id: "long",
      title: "Длинная подпись",
      note: "содержимое кладёт потребитель, и оно бывает длиннее места — смотрим, как держится",
      at: { variant: null, state: null },
      props: { children: "Сохранить и вернуться к перечню документов" },
    }),
  ],
};

/**
 * Показ компонента целиком: порождённое осями плюс названное человеком, ОДНИМ потоком.
 *
 * Фильтр применяется к ОБОИМ родам одинаково — по координате случая. Прежде человеческие случаи
 * висели в потоке при любом срезе, и это читалось как «фильтр не работает»: он работал, просто
 * сравнивать ему было нечего.
 *
 * Человеческие идут после осевых: оси отвечают на «одето ли всё», человеческие — на «как
 * держится». При одевании первый вопрос возникает раньше.
 *
 * @param component адрес компонента в реестре
 * @param slice срез осей
 */
export function casesOf(component: string, slice: Slice): ShowcaseCase[] {
  const humans = (HUMAN_CASES[component] ?? []).filter((item) => inSlice(item, component, slice));

  return [...axisCases(component, slice), ...humans];
}

/**
 * Стоит ли случай в срезе: названная ось обязана совпасть, ось «все» пропускает любой.
 *
 * Часть сравнивается с корневой по умолчанию — случай, не назвавший части, про корень и есть.
 */
function inSlice(item: ShowcaseCase, component: string, slice: Slice): boolean {
  const part = slice.part ?? rootPartOf(component);

  if ((item.at.part ?? rootPartOf(component)) !== part) return false;
  if (slice.variant !== undefined && slice.variant !== null && item.at.variant !== slice.variant) {
    return false;
  }

  return !(slice.state !== undefined && slice.state !== null && item.at.state !== slice.state);
}
