// СЛУЧАИ — компонент в условии, ради которого на него стоит смотреть (`PWEB-31`).
//
// ## Дерево случая порождается, а не верстается
//
// Каждый случай начинается с ОБРАЗЦА (`sketchOf`) — дерева частей, выведенного из анатомии
// компонента. Условие накладывается сверху правкой узла, и правка идёт через механику
// (`updateNode`), а не подстановкой полей руками.
//
// Причина ровно та, ради которой витрина вообще строится на механике: свёрстанный руками
// случай проверяет вёрстку случая. Порождённый — проверяет механику, паспорт и скин разом.
// Объяви паспорт часть, которой компонент не рисует, — это видно ЗДЕСЬ, в живой витрине, а не
// в отчёте пробы.
//
// ## Условие бывает трёх родов, и здесь только два из них
//
// Состояние и содержимое — на узле; окружение (узкое место, тёмный режим, соседство) — вокруг
// него, и его задаёт страница компонента, а не случай.
//
// ## Когда все случаи выглядят одинаково
//
// Значит скин снят — и это законное рабочее состояние продукта, а не поломка витрины
// (`kb:PROBEWEB-11`). Голый кит с адресными атрибутами жив и адресуем; наденьте скин, и ни одна
// строка отсюда для этого не изменится.

import { sketchOf, updateNode, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { FORCE_ATTRIBUTE } from "@omnifield/probe-web-skin/model";
import { passportOf, type PassportMark } from "@omnifield/probe-web-ui/passport";

import { REGISTRY } from "./registry.js";

/** Один случай: компонент в названном условии. */
export interface ShowcaseCase {
  readonly id: string;
  /** Короткое имя условия — заголовок блока. */
  readonly title: string;
  /** Зачем случай показан. Случай без повода не показывают. */
  readonly note: string;
  /** Дерево случая: образец компонента плюс условие. */
  readonly tree: AssemblyTree;
}

/** Что накладывается на образец. Пропы уезжают в компонент как есть. */
interface Condition {
  readonly id: string;
  readonly title: string;
  readonly note: string;
  readonly props: Readonly<Record<string, unknown>>;
}

/**
 * Собирает случай: образец компонента плюс условие на его корневом узле.
 *
 * Отказ механики здесь — **исключение**, а не значение, и это единственное такое место в зоне.
 * Причина: отказ означает, что случай написан против паспорта — назван компонент, которого нет
 * в реестре, или узел, которого нет в образце. Это дефект нашей записи, а не состояние данных,
 * и молча показать вместо него пустое место значило бы спрятать его от себя же.
 *
 * @param component адрес компонента в реестре
 * @param condition условие: имя, пояснение и пропы корневого узла
 */
function caseOf(component: string, condition: Condition): ShowcaseCase {
  const sketch = sketchOf(REGISTRY, component);

  if (!sketch) {
    throw new Error(`витрина: компонента «${component}» нет в реестре — случай собрать не из чего`);
  }

  const edited = updateNode(sketch, sketch.components.root, { props: condition.props });

  if (!edited.ok) {
    throw new Error(`витрина: случай «${condition.id}» отвергнут механикой — ${edited.means}`);
  }

  return {
    id: condition.id,
    title: condition.title,
    note: condition.note,
    tree: edited.tree,
  };
}

/**
 * Случаи кнопки.
 *
 * Первый — базовый: он же попадает в общий перечень витрины. Дальше состояния и содержимое.
 *
 * **Три состояния выставлены признаком, а не пропом,** и это не обход контракта: наведение,
 * клавиатурный фокус и нажатие ставит БРАУЗЕР, компонент их не знает и объявить атрибутом не
 * может. Признак читает то же правило скина, что и настоящий псевдокласс, — пару доводов даёт
 * генератор при порождении, поэтому предпросмотр показывает ровно то, что уедет в поставку.
 *
 * Отключённость и занятость — наоборот, настоящие пропы: их компонент показывает сам, и
 * подменять их признаком значило бы проверять не тот путь.
 */
export const BUTTON_CASES: readonly ShowcaseCase[] = [
  caseOf("button", {
    id: "base",
    title: "Базовый",
    note: "кнопка как её ставят чаще всего — подпись и ничего больше",
    props: { children: "Сохранить" },
  }),
  caseOf("button", {
    id: "disabled",
    title: "Отключена",
    note: "нажать нельзя; кнопка показывает это сама — `data-disabled` ставит кит",
    props: { children: "Сохранить", disabled: true },
  }),
  caseOf("button", {
    id: "busy",
    title: "Занята",
    note: "работа идёт: занятость собирается из готового — отключённость плюс `aria-busy`",
    props: { children: "Сохраняю…", disabled: true, "aria-busy": "true" },
  }),
  caseOf("button", {
    id: "hover",
    title: "Наведение",
    note: "состояние ставит браузер — в витрине оно показано признаком, а правило одно и то же",
    props: { children: "Сохранить", [FORCE_ATTRIBUTE]: "hover" },
  }),
  caseOf("button", {
    id: "focus-visible",
    title: "Фокус с клавиатуры",
    note: "обвод нужен пришедшему с клавиатуры; при нажатии мышью он лишний",
    props: { children: "Сохранить", [FORCE_ATTRIBUTE]: "focus-visible" },
  }),
  caseOf("button", {
    id: "active",
    title: "Нажата",
    note: "кнопку держат нажатой",
    props: { children: "Сохранить", [FORCE_ATTRIBUTE]: "active" },
  }),
  caseOf("button", {
    id: "long",
    title: "Длинная подпись",
    note: "содержимое кладёт потребитель, и оно бывает длиннее места — смотрим, как держится",
    props: { children: "Сохранить и вернуться к перечню документов" },
  }),
];

/** Случаи по адресу компонента. Перечня «всех компонентов» здесь нет — он приходит из реестра. */
export const CASES: Readonly<Record<string, readonly ShowcaseCase[]>> = {
  button: BUTTON_CASES,
};

/** Клетка сетки: компонент в одной вариации и одном состоянии. */
export interface MatrixCell {
  /** Вариация; пусто — атрибут не поставлен, действует умолчание скина. */
  readonly variant: string | null;
  /** Состояние; пусто — обычное. */
  readonly state: string | null;
  /** Координата человеческими словами — то, чем это адресует скин. */
  readonly address: string;
  /** Дерево клетки. */
  readonly tree: AssemblyTree;
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

/**
 * СЕТКА: каждая вариация в каждом состоянии.
 *
 * Ради этого витрина и существует. Вариации по одной оси, состояния по другой — так делают
 * дизайн-системы, и по названной причине: сетка сообщает, что перечень многомерен, а колонка
 * этого не сообщает. Одевающий видит не «кнопку», а все места, которые ему предстоит одеть, — и
 * сразу видит дыры: клетка, ничем не отличающаяся от соседней, значит правило не написано.
 *
 * Первая строка — БЕЗ имени вариации: умолчание скина и «атрибут не поставлен» это один адрес, и
 * показывать его надо тем, чем он и является, — отсутствием атрибута.
 *
 * @param component адрес компонента в реестре
 * @param variants имена вариаций из записи надетого скина
 */
export function matrixOf(component: string, variants: readonly string[]): MatrixCell[] {
  const passport = passportOf(component);
  const part = passport?.parts.find((item) => item.name === passport.root);
  const states = part?.states ?? [];
  const axis = passport?.variantAxis.mark;

  const cells: MatrixCell[] = [];

  for (const variant of [null, ...variants]) {
    const variantProps =
      variant === null || axis?.kind !== "attribute" ? {} : { [axis.name]: variant };

    for (const state of [null, ...states]) {
      const sketch = sketchOf(REGISTRY, component);
      if (!sketch) continue;

      const edited = updateNode(sketch, sketch.components.root, {
        props: {
          children: "Кнопка",
          ...variantProps,
          ...(state === null ? {} : stateProps(state.mark)),
        },
      });

      if (!edited.ok) continue;

      cells.push({
        variant,
        state: state?.name ?? null,
        address: [component, variant ?? "умолчание", state?.name ?? "обычное"].join(" · "),
        tree: edited.tree,
      });
    }
  }

  return cells;
}

/**
 * Случаи вариаций — по одному на каждое имя, объявленное СКИНОМ.
 *
 * Здесь перечня имён нет и быть не может: вариации принадлежат скину, а не паспорту и не
 * витрине. Нет надетого скина — нет и случаев: называть нечего, и показывать «вариации вообще»
 * значило бы придумать их за автора скина.
 *
 * Отдельной функцией, а не полем в `CASES`, ровно поэтому: состав зависит от того, что надето
 * СЕЙЧАС, и пересчитывается при смене скина.
 *
 * @param component адрес компонента в реестре
 * @param names имена вариаций из записи надетого скина
 */
export function variantCases(
  component: string,
  names: readonly string[],
): readonly ShowcaseCase[] {
  return names.map((name) =>
    caseOf(component, {
      id: `variant-${name}`,
      title: name,
      note: "имя вариации придумал человек вместе со скином; кит пропускает его насквозь",
      props: { children: "Сохранить", "data-variant": name },
    }),
  );
}
