// ОТРИСОВКА по данным — перенос `packages/web/runtime/renderer/src/renderer.tsx` (601 строка)
// из старого репозитория `egor6-66/capsuleTech`.
//
// Что снято при переносе и почему — в README, раздел «Что снято». Здесь остаётся то, что
// решает нашу задачу, и вместе с кодом перенесены причины: они оплачены опытом, и
// переоткрывать их незачем.
//
// ## Четыре решения, перенесённые вместе с причинами
//
// 1. **`createComponent` напрямую, а не `<Dynamic>`.** `<Dynamic>` оборачивает вызов
//    компонента в `createMemo + untrack` — то есть добавляет узлу лишний слой вычисления.
//    В источнике это вскрылось больно: обёртка рвала цепочку контекстов, и вложенный
//    компонент не видел того, что дал ему владелец. Нашей причины «рвётся контекст» больше
//    нет — вместе с прежней архитектурой ушло и то, что рвалось, — но остаётся первая: узлов
//    в дереве редактора сотни, и лишний слой на каждом это лишний слой на каждом.
//    `createComponent` — ровно то, во что компилируется обычный `<X />`.
//
// 2. **Запасной вид на неразрешённый адрес — явный.** Узел, чей адрес реестр не знает, не
//    пропускается молча: молчание в редакторе неотличимо от «узел есть, просто пустой», и
//    человек ищет несуществующую ошибку вёрстки вместо опечатки в адресе.
//
// 3. **Упавший узел не уносит соседей.** Граница ошибок ставится НА КАЖДЫЙ узел, а не на
//    дерево: в редакторе половина узлов заведомо недособрана, и одна ошибка, гасящая всё
//    дерево, делает редактор непригодным ровно в тот момент, когда он нужнее всего.
//
// 4. **Слот украшения (`editOverlay`) — отдельная ось, а не режим отрисовки.** Хозяин рисует
//    в нём обводку, подсветку, ручку перетаскивания. Не задан — путь отрисовки не меняется
//    вовсе: ни обёрток, ни лишних узлов, ни ветвлений в разметке.
//
// ## Что отрисовка ставит на узел САМА
//
// Ровно одно: признак `data-node` с именем узла (`PWEB-27`). Им узел адресуется снаружи дерева
// — правилом правки образца, которое порождает генератор скина. Без признака вторая область
// адреса существовала бы в записи и не существовала бы в разметке.
//
// ## Дети обходятся ОДНОРОДНО (`PWEB-83`)
//
// Ветки «либо дети, либо текст из пропов» здесь больше нет. Она выражала одно из двух там, где
// паспорт объявлял оба сразу: у кнопки раздела гармошки допустимы и указатель (часть), и подпись
// (содержимое) — и подпись молча пропадала, стоило появиться указателю. Теперь содержимое это
// УЗЕЛ среди детей, и путь один: обойти детей по порядку. Порядок содержимого относительно
// частей выражается тем же списком, а не отдельной механикой.
//
// Проп `children` содержимым больше не считается: он перебивается детьми узла всегда, и потерю
// называет проверка целостности (`content-in-props`), а не молчание отрисовки.
//
// ## Чего эта отрисовка не делает
//
// Не приносит вида. Карта стилей на узле (`styles`) СНЯТА (`PWEB-27`): вид приходит правилами
// по адресам, а не пропом узла — встроенный стиль перебивал бы любой скин, и поправленное в
// конструкторе место перестало бы одеваться навсегда.
//
// Не решает, как выглядит узел, как показывается выделение и что значит «выбрано». Это вид, а
// вид — не предмет механики: она отвечает на «чем это нарисовать», а не на «что должно
// получиться».

import {
  type Component,
  createEffect,
  createMemo,
  ErrorBoundary,
  For,
  type JSX,
  mergeProps,
  Show,
  Suspense,
} from "solid-js";
import { createComponent } from "solid-js/web";

import { checkTree } from "./integrity.js";
import { allowedInside } from "./nesting.js";
import { readAddress, resolveComponent, type Registry } from "./registry.js";
import { growSelfAssembly } from "./self-assembly.js";
import { note, trace } from "./trace.js";
import {
  EMPTY_TREE,
  isContent,
  isDataBinding,
  resolveDataBinding,
  type AssemblyElement,
  type AssemblyTree,
  type DispatchedEvent,
  type NodeId,
} from "./tree.js";

/** Что получает запасной вид: чей адрес не разрешился и у какого узла. */
export interface FallbackProps {
  readonly type: string;
  readonly nodeId: NodeId;
}

/**
 * Что получает запасной вид упавшего узла.
 *
 * `reset` — повторная попытка отрисовать узел (граница ошибок Solid). Нужен ровно там, где
 * ошибка временная: узел недособран, человек дописал недостающий проп — и узел обязан ожить
 * без пересборки всего дерева.
 */
export interface ErrorFallbackProps {
  readonly type: string;
  readonly nodeId: NodeId;
  readonly error: unknown;
  readonly reset: () => void;
}

/**
 * Что получает слот украшения на узле компонента.
 *
 * Узла содержимого здесь нет намеренно (`PWEB-83`): подпись это текст, а не элемент, — своего
 * бокса у неё нет, и обвести её можно было бы только чужой обёрткой ВНУТРИ компонента кита.
 * Такая обёртка попала бы в разметку, за которую цепляется скин, и раскладка кнопки с одной
 * подписью отличалась бы от кнопки с двумя. Выделять содержимое редактор обязан списком узлов,
 * а не холстом.
 */
export interface EditOverlayProps {
  readonly nodeId: NodeId;
  readonly node: AssemblyElement;
}

export interface RenderTreeProps {
  /**
   * Дерево. Необязательно намеренно: потребитель законно отдаёт `undefined` в первый кадр —
   * данные ещё не пришли. Такой кадр рисует ничего и молчит, а не падает.
   */
  tree?: AssemblyTree;
  /** Чем рисовать и что объявлено. */
  registry: Registry;
  /** Запасной вид на неразрешённый адрес. Без него — предупреждение в трассу и ничего. */
  fallback?: Component<FallbackProps>;
  /** Запасной вид на упавший узел. Ставится на каждый узел; без него — трасса и ничего. */
  errorFallback?: Component<ErrorFallbackProps>;
  /** Что показывать, пока грузится отложенное поддерево. */
  loadingFallback?: JSX.Element;
  /**
   * Слот украшения на каждый узел: обводка, подсветка, ручка перетаскивания.
   *
   * Ортогонален отрисовке, а не режим: отсутствует — путь отрисовки прежний, ни одного
   * лишнего узла в разметке.
   */
  editOverlay?: Component<EditOverlayProps>;
  /**
   * Данные, которыми разрешаются `DataBinding`-узлы содержимого (`{path}`, `PWEB-156`).
   *
   * Дерево остаётся тем же объявлением структуры, что и раньше — данные приходят ОТДЕЛЬНО, и это
   * не приём этой отрисовки, а её же собственный урок: `styles` когда-то тоже сидели на узле
   * пропом и были сняты по тому же доводу («Вид не приписывается узлу» в README пакета).
   *
   * Не задано — узлы без `{path}` рисуются как раньше (литерал), узлы с `{path}` резолвятся в
   * `undefined` (пустая строка на экране, не падение): показ кита без данных — законное рабочее
   * состояние, тем же приёмом, что голый кит без скина.
   */
  data?: unknown;
  /**
   * Одна точка входа для СОБЫТИЙ ЛЮБОГО узла (`on`, `PWEB-157`) — форма A2UI: узел объявляет
   * данными «на клике сказать событие "open"», а не несёт колбэк. Не задан — узлы с `on`
   * реагируют на своё родное DOM-событие как обычно (`onClick` естественно всплывает), просто
   * никто об этом не узнаёт снаружи: отсутствие `dispatch` не ошибка, тем же приёмом, что и
   * отсутствие `data`.
   */
  dispatch?: (event: DispatchedEvent) => void;
}

/**
 * Запасной вид по умолчанию: сказать в трассу и не рисовать ничего.
 *
 * Сообщение печатается в эффекте, а не в теле: тело выполняется один раз, а адрес узла в
 * редакторе правят — и второе сообщение о втором неразрешённом адресе так же нужно, как первое.
 */
const DefaultFallback: Component<FallbackProps> = (props) => {
  createEffect(() => {
    note(`адрес «${props.type}» не разрешён — узел «${props.nodeId}» не нарисован`);
  });
  return null;
};

/** Запасной вид упавшего узла по умолчанию: ошибка всегда видна, даже без своего слота. */
const DefaultErrorFallback: Component<ErrorFallbackProps> = (props) => {
  createEffect(() => {
    console.error(
      `[probe-web-assembly] узел «${props.nodeId}» (${props.type}) упал при отрисовке:`,
      props.error,
    );
  });
  return null;
};

/**
 * Пускает ли узел что-либо внутрь себя — по паспорту, а не по списку.
 *
 * Здесь снят единственный собственный перечень, который был в источнике: там лежал жёстко
 * вписанный набор адресов (`ui.Input`, `ui.Separator`, `ui.Image`…), чьи узлы детей не
 * принимают, и украшение для них оборачивалось снаружи. Такой список — это ровно те
 * собственные правила, которых механике заводить нельзя: он знал имена чужих компонентов и
 * устаревал при первом же новом.
 *
 * Ответ на тот же вопрос уже есть в паспорте. Пустой перечень допустимого значит «место занято
 * самим компонентом»: такому узлу украшение внутрь не положить — компонент его не отрисует.
 * Часть, не запрещающая ничего, и часть с непустым перечнем детей принимают — им украшение
 * идёт внутрь, и раскладка не меняется.
 *
 * Паспорт молчит вовсе (адрес не паспортизован) — берём обёртку: она работает всегда, а
 * украшение обязано достаться КАЖДОМУ узлу.
 */
const takesContent = (registry: Registry, type: string): boolean => {
  const allowed = allowedInside(registry, type);
  if (!allowed) return false;
  return (
    allowed.unrestricted ||
    allowed.parts.length > 0 ||
    allowed.genera.length > 0 ||
    allowed.components
  );
};

interface RenderNodeProps {
  nodeId: NodeId;
  tree: AssemblyTree;
  registry: Registry;
  fallback: Component<FallbackProps>;
  errorFallback: Component<ErrorFallbackProps>;
  editOverlay?: Component<EditOverlayProps>;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
}

/**
 * Материальное для пересборки узла: сменилось — узел собирается заново, нет — живёт.
 *
 * Род стоит рядом с адресом: узел, ставший из компонента содержимым (или наоборот), рисуется
 * другим путём, и оставить его смонтированным нельзя. Значение и пропы материальными не
 * являются — они доезжают геттерами, не трогая монтаж.
 */
interface RenderSignature {
  type: string | undefined;
  genus: string | undefined;
  fallback: Component<FallbackProps>;
}

/**
 * Рисует один узел и его детей.
 *
 * Пропы узла читаются ЧЕРЕЗ ФУНКЦИИ (`mergeProps` с геттерами): правка узла — смена пропа,
 * стиля, текста — доезжает до живого компонента, не пересобирая его. Пересборка происходит
 * только когда сменилось материальное (см. `RenderSignature`).
 */
const RenderNode: Component<RenderNodeProps> = (props) => {
  const node = () => props.tree.components.nodes[props.nodeId];

  const resolved = createMemo(() => {
    const current = node();
    if (!current || isContent(current)) return undefined;
    return resolveComponent(props.registry, current.type);
  });

  /**
   * A bare reference to a component that declares its own behavior (`PWEB-167`/`PWEB-169`) —
   * `undefined` for everything else, including that SAME component's own root when it is the
   * tree currently being rendered directly (`parentId === null`): a self-assembly is what a
   * reference from someone else's tree triggers, not what overrides an explicit choice of
   * assembly at the top. `read.part === read.passport.root` is the same test `PWEB-166` already
   * uses to tell a bare component address from one of its own named parts.
   */
  const selfAssemblyTree = createMemo((): AssemblyTree | undefined => {
    const current = node();
    if (!current || isContent(current) || current.parentId === null) return undefined;

    const read = readAddress(props.registry, current.type);
    if (!read || read.part !== read.passport.root || !read.passport.selfAssembly) return undefined;

    return growSelfAssembly(read.passport.selfAssembly, read.address, read.passport.root);
  });

  /**
   * Дети узла — однородно, оба рода в одном списке (`PWEB-83`).
   *
   * Детей нет — `null`, а не проп `children` узла: содержимое приезжает узлом, и оставь мы здесь
   * запасной путь через пропы, у одного вопроса снова стало бы два ответа.
   *
   * Именно `null`, а не `undefined`: `mergeProps` Solid значением `undefined` предыдущий источник
   * НЕ перекрывает, и проп `children` узла просочился бы обратно — то есть прежняя форма
   * продолжила бы работать в точности там, где детей нет.
   */
  const contentOf = () => {
    const current = node();
    if (!current || current.children.length === 0) return null;

    return (
      <For each={(node()?.children ?? []) as readonly NodeId[]}>
        {(childId) => (
          <RenderNode
            nodeId={childId}
            tree={props.tree}
            registry={props.registry}
            fallback={props.fallback}
            errorFallback={props.errorFallback}
            editOverlay={props.editOverlay}
            data={props.data}
            dispatch={props.dispatch}
          />
        )}
      </For>
    );
  };

  /**
   * Значение узла содержимого — читается через функцию, поэтому правка подписи доезжает живой.
   *
   * Литерал — как раньше. `{path}` — резолвится против `props.data` (`PWEB-156`); мимо пути или
   * без данных вовсе — пустая строка, тем же приёмом, что и у неразрешённого адреса: показ
   * молчит, а не падает.
   */
  const valueOf = () => {
    const current = node();
    if (!current || !isContent(current)) return "";

    const value = current.value;
    if (!isDataBinding(value)) return value;

    const resolved = resolveDataBinding(props.data, value.path);
    return typeof resolved === "string" ? resolved : (resolved?.toString() ?? "");
  };

  /**
   * Чем узел назвать тому, кто показывает ошибку: адресом либо родом.
   *
   * У содержимого адреса нет, и написать «неизвестен» о нём было бы неправдой — род известен.
   */
  const typeOrGenus = () => {
    const current = node();
    if (!current) return "неизвестен";
    return isContent(current) ? `содержимое:${current.genus}` : current.type;
  };

  /**
   * Украшение узла. Позиционируется целиком по боксу узла и событий не ловит — ловлю включает
   * сам хозяин внутри своего компонента.
   */
  const overlay = (EditOverlay: Component<EditOverlayProps>) => (
    <span
      style={{ position: "absolute", inset: 0, "pointer-events": "none" }}
      aria-hidden="true"
    >
      {createComponent(EditOverlay, {
        get nodeId() {
          return node()?.id ?? props.nodeId;
        },
        get node() {
          // Украшение достаётся только узлам компонентов — путь сюда идёт после проверки рода.
          return node() as AssemblyElement;
        },
      })}
    </span>
  );

  /**
   * Обёртка для узла, который украшение внутрь не пускает.
   *
   * `display:block`, а не `display:contents`: по правилам CSS элемент с `display:contents`
   * собственного бокса не создаёт, поэтому `position:relative` на нём браузер игнорирует — и
   * украшение растянулось бы по ближайшему настоящему боксу, то есть накрыло бы родителя
   * целиком вместо своего узла. Это ошибка источника, найденная там пробой; проба перенесена
   * вместе с решением.
   */
  const wrapped = (body: JSX.Element, EditOverlay: Component<EditOverlayProps>) => (
    <span style={{ display: "block", position: "relative" }}>
      {body}
      {overlay(EditOverlay)}
    </span>
  );

  /**
   * Пропы самого узла — источником для `mergeProps`.
   *
   * Именованная функция, а не выражение по месту: так источник читается как то, чем он
   * является, — реактивным чтением узла, — и одинаков во всех трёх путях отрисовки.
   */
  /**
   * Пропы узла: литерал (`props`) плюс резолвленные из данных (`bind`, `PWEB-156`) поверх —
   * побеждает `bind`, привозящий актуальное данными там, где `props` привёз бы умолчание.
   * Путь мимо данных — прочерк не ставится, ключ просто не резолвится ни во что (`undefined`
   * не перебивает предыдущий источник у `mergeProps`, литерал `props` в этом случае и остаётся
   * действующим видом — тем же приёмом, что и у содержимого без данных).
   */
  /**
   * Родное DOM-событие → имя пропа, которым Solid его слушает. Закрытый маленький перечень —
   * ровно те события, для которых у события есть смысл «что-то сказать наружу» (`PWEB-157`):
   * заводить его открытым значило бы решать за компонент, какие у него вообще бывают события.
   */
  const DOM_EVENT_PROP: Readonly<Record<string, string>> = {
    click: "onClick",
    change: "onChange",
    input: "onInput",
    submit: "onSubmit",
  };

  /**
   * Обработчики, синтезированные из `on` (`PWEB-157`): узел объявил данными «на клике сказать
   * событие "open"» — здесь это превращается в настоящий `onClick`, который резолвит `context` из
   * `bind`-путей (тем же резолвером, что и у пропов) и зовёт `props.dispatch` уже готовым JSON,
   * без утечки сырого DOM `Event` наружу — вызывающий получает то же самое, что получил бы от
   * сервера в форме A2UI.
   */
  const dispatchHandlers = () => {
    const current = node();
    if (!current || isContent(current) || !current.on) return {};

    return Object.fromEntries(
      Object.entries(current.on).flatMap(([domEvent, action]) => {
        const propName = DOM_EVENT_PROP[domEvent];
        if (!propName) return [];

        return [
          [
            propName,
            () => {
              const context = Object.fromEntries(
                Object.entries(action.event.context ?? {})
                  .map(([key, value]) => [
                    key,
                    isDataBinding(value) ? resolveDataBinding(props.data, value.path) : value,
                  ] as const)
                  .filter(([, value]) => value !== undefined),
              );

              props.dispatch?.({
                name: action.event.name,
                nodeId: current.id,
                address: current.type,
                timestamp: new Date().toISOString(),
                context,
              });
            },
          ],
        ];
      }),
    );
  };

  /** `bind` resolved against `props.data` — shared by a node's own props and (`PWEB-169`) by the
   *  data a self-assembly reference feeds into what it triggers. */
  const resolvedBind = (bind: Readonly<Record<string, string>> | undefined) =>
    bind
      ? Object.fromEntries(
          Object.entries(bind)
            .map(([name, path]) => [name, resolveDataBinding(props.data, path)] as const)
            .filter(([, value]) => value !== undefined),
        )
      : undefined;

  const ownProps = () => {
    const current = node();
    if (!current || isContent(current)) return {};

    return { ...current.props, ...resolvedBind(current.bind), ...dispatchHandlers() };
  };

  /**
   * Data fed into a component reference's own behavior (`PWEB-169`): its literal `props` plus
   * its `bind` resolved against the OUTER data — the same values `ownProps` would have handed
   * the bare root part under `PWEB-166`, now handed to the referenced component's own tree as
   * DATA instead, for it to resolve through its own `/label`-style paths.
   */
  const innerData = () => {
    const current = node();
    if (!current || isContent(current)) return undefined;
    return { ...current.props, ...resolvedBind(current.bind) };
  };

  /**
   * ПРИЗНАК УЗЛА В РАЗМЕТКЕ — то, чем узел адресуется снаружи дерева (`PWEB-27`).
   *
   * Вид приходит правилами по двум областям адреса: координата паспорта
   * (`[data-scope][data-part]`) — на все узлы с такой частью; идентификатор узла — на один
   * узел. Вторая область существовала только в записи: разметка о ней ничего не знала, потому
   * что механика раньше прокидывала вид пропом (`styles`) и ничего опознающего на узел не
   * ставила, а кит безголовый и своего не добавит.
   *
   * Поэтому признак ставит МЕХАНИКА. Не потребитель — он о дереве не знает; и не редактор —
   * тогда это была бы его самодеятельность, и у двух редакторов она разошлась бы.
   *
   * Ставится ПОСЛЕ пропов узла: перебить признак собственным пропом нельзя, иначе правило,
   * адресующее узел, промахнулось бы молча.
   *
   * Вес правила по признаку — забота того, кто порождает CSS: одна единица против двух у
   * координаты, и порядок здесь не спасает. Механика даёт зацепку, а не каскад.
   */
  const identityProps = {
    get "data-node"() {
      return node()?.id ?? props.nodeId;
    },
  };

  /** Внешний компонент композиции, если узел составной. */
  const outer = createMemo(() => {
    const current = node();
    const composed = current && !isContent(current) ? current.composedInto : undefined;
    if (composed === undefined) return undefined;
    return resolveComponent(props.registry, composed);
  });

  /**
   * Что на самом деле зовётся для узла (`PWEB-33`).
   *
   * Обычный узел рисует себя сам. Составной — «кнопка, вставленная в триггер окна» — рисуется
   * ВНЕШНИМ компонентом, которому внутренний передаётся пропом `as`: так композицию делает сам
   * кит, и механика пользуется его механизмом, а не заводит второй.
   *
   * Отсюда и распределение: поведение и состояние приходят от внешнего (раскрытость окна
   * приезжает на узел отдельным атрибутом), адресные атрибуты ставит внутренний — тот, чем
   * вещь является визуально. Ни того, ни другого механика не устраивает руками: она лишь
   * зовёт то, что кит уже умеет.
   *
   * `missing` называет ИМЕННО ТОТ адрес, который не разрешился: у составного узла их два, и
   * «не нашёлся popover.trigger» отличается от «не нашлась button» ровно тем, что человек
   * пойдёт чинить.
   */
  const assembled = ():
    | { kind: "component"; Comp: unknown; composition?: { as: unknown } }
    | { kind: "missing"; type: string } => {
    const current = node();
    const Inner = resolved();
    if (!current || isContent(current)) return { kind: "missing", type: "" };
    if (!Inner) return { kind: "missing", type: current.type };

    const composed = current.composedInto;
    if (composed === undefined) return { kind: "component", Comp: Inner };

    const Outer = outer();
    if (!Outer) return { kind: "missing", type: composed };

    return { kind: "component", Comp: Outer, composition: { as: Inner } };
  };

  const rendered = () => {
    const current = node();
    if (!current) return null;

    // Узел содержимого — лист: значение, и ничего вокруг него. Ни признака узла (адресовать
    // нечего — текст не элемент), ни запасного вида (разрешать нечего — адреса нет), ни
    // украшения (причина — у `EditOverlayProps`).
    if (isContent(current)) {
      const closeContent = trace(`содержимое ${current.id} (${current.genus})`);
      try {
        return <>{valueOf()}</>;
      } finally {
        closeContent();
      }
    }

    const close = trace(`узел ${current.id} (${current.type})`);
    try {
      // A bare reference to a component with its own behavior (`PWEB-169`) unfolds THAT tree,
      // fed by this node's own data, instead of being drawn as the bare root part with this
      // node's `on`/`children` (`PWEB-166`) — resolving a reference is a recursive call into the
      // same mechanic, not a separate, poorer render path (page 112 §"Находка").
      const selfTree = selfAssemblyTree();
      if (selfTree) {
        return (
          <RenderTree
            registry={props.registry}
            tree={selfTree}
            data={innerData()}
            dispatch={props.dispatch}
            fallback={props.fallback}
            errorFallback={props.errorFallback}
          />
        );
      }

      const built = assembled();
      const EditOverlay = props.editOverlay;

      // Адрес не разрешился — явный запасной вид. Украшение ему тоже полагается: узел в
      // дереве есть, и в редакторе его должно быть можно выделить и убрать.
      if (built.kind === "missing") {
        const body = createComponent(props.fallback, { type: built.type, nodeId: current.id });
        return EditOverlay ? wrapped(body, EditOverlay) : body;
      }

      const Comp = built.Comp;
      // Композиция ставится ПОСЛЕ пропов узла и до признака: `as` — не проп потребителя, а то,
      // из чего узел собран, и перебить его пропом было бы тем самым вторым способом надеть
      // внешний компонент.
      const composition = built.composition ?? {};

      // Обычный путь: украшения нет — нет и ветвлений.
      if (!EditOverlay) {
        const plainProps = mergeProps(ownProps, composition, identityProps, {
          get meta() {
            return node()?.meta;
          },
          get children() {
            return contentOf();
          },
        });
        return createComponent(Comp as Component<Record<string, unknown>>, plainProps);
      }

      // Узел не пускает содержимое — украшение идёт снаружи, обёрткой.
      if (!takesContent(props.registry, current.type)) {
        const closedProps = mergeProps(ownProps, composition, identityProps, {
          get meta() {
            return node()?.meta;
          },
        });
        const body = createComponent(Comp as Component<Record<string, unknown>>, closedProps);
        return wrapped(body, EditOverlay);
      }

      // Узел пускает содержимое — украшение идёт внутрь, ПОСЛЕ настоящих детей. Раскладку оно
      // не двигает: украшение позиционировано абсолютно, а узлу навязывается только
      // `position:relative` — без него абсолютной привязке не за что зацепиться.
      const decoratedProps = mergeProps(ownProps, composition, identityProps, {
          get style() {
            const own = (ownProps() as { style?: unknown }).style;
            if (typeof own === "string") return `position:relative; ${own}`;
            if (own && typeof own === "object") return { position: "relative", ...own };
            return "position:relative";
          },
          get meta() {
            return node()?.meta;
          },
          get children() {
            return (
              <>
                {contentOf()}
                {overlay(EditOverlay)}
              </>
            );
          },
      });
      return createComponent(Comp as Component<Record<string, unknown>>, decoratedProps);
    } finally {
      close();
    }
  };

  /**
   * Что считается материальным.
   *
   * Смена адреса — это другой компонент, узел собирается заново. Смена запасного вида важна
   * только неразрешённому узлу, но отличить его здесь дешевле, чем гадать. Всё остальное —
   * пропы, стили, дети — доезжает через геттеры, не трогая монтаж.
   *
   * Память возвращает ПРЕЖНЮЮ ссылку, когда материальное не менялось: на ней и держится
   * стабильность монтажа ниже.
   */
  const signature = createMemo((previous: RenderSignature | undefined): RenderSignature => {
    const current = node();
    const next: RenderSignature = {
      type: current && !isContent(current) ? current.type : undefined,
      genus: current && isContent(current) ? current.genus : undefined,
      fallback: props.fallback,
    };
    if (!previous) return next;
    if (previous.type !== next.type) return next;
    if (previous.genus !== next.genus) return next;
    if (previous.fallback !== next.fallback) return next;
    return previous;
  });

  const Mounted: Component = () => rendered() as unknown as JSX.Element;

  // `<For>` по одноэлементному перечню — управляемая пересборка: пока подпись возвращает ту же
  // ссылку, узел остаётся смонтированным; сменилась — `For` пересобирает его.
  //
  // Граница ошибок снаружи, а внутри неё КОМПОНЕНТ, а не вызов: тело компонента выполняется в
  // вычислении, которое граница накрывает, а прямой вызов — нет (Solid 1.9.x). Ошибка узла
  // остаётся в его поддереве и соседей не задевает.
  return (
    <ErrorBoundary
      fallback={(error, reset) =>
        createComponent(props.errorFallback, {
          type: typeOrGenus(),
          nodeId: props.nodeId,
          error,
          reset,
        })
      }
    >
      <For each={[signature()]}>{() => <Mounted />}</For>
    </ErrorBoundary>
  );
};

/**
 * Рисует дерево от корня.
 *
 * Один и тот же вызов и в редакторе (предпросмотр), и у потребителя (готовая страница): дерево
 * это данные, и второго способа превратить их в вид не существует. Разойдись эти два пути —
 * предпросмотр перестал бы отвечать за то, что увидит человек.
 */
export const RenderTree: Component<RenderTreeProps> = (props) => {
  const tree = () => props.tree ?? EMPTY_TREE;
  const fallback = () => props.fallback ?? DefaultFallback;
  const errorFallback = () => props.errorFallback ?? DefaultErrorFallback;

  // Целостность проверяется трассой, а не отказом рисовать: дерево с изъяном всё равно надо
  // показать — человек чинит его глядя, а не по описанию. Отказать здесь значило бы гасить
  // редактор ровно в тот момент, когда он нужен.
  //
  // Каждый изъян называется ОДИН раз: в редакторе дерево меняется на каждое нажатие, и
  // повторённая на каждую правку строка перестаёт читаться уже к десятой. Память живёт в
  // замыкании этого монтажа — новый монтаж, новая сессия, изъяны снова стоит назвать.
  const told = new Set<string>();
  createEffect(() => {
    for (const flaw of checkTree(tree())) {
      const key = `${flaw.flaw}:${flaw.nodeId}:${flaw.relatedId ?? ""}`;
      if (told.has(key)) continue;
      told.add(key);
      note(`изъян ${flaw.flaw}: ${flaw.means}`);
    }
  });

  /**
   * Невидимый провайдер компонента-корня, если он назвал такой (`PWEB-153`).
   *
   * Единственное место, где отрисовка смотрит на `provider`: у компонентов вроде поповера/меню
   * корневая ЧАСТЬ (`positioner`) не рисует собственного DOM-узла — состояние ей даёт контекст,
   * который раздаёт этот провайдер, и без обёртки часть падает при попытке его прочитать.
   * Ищется по КОМПОНЕНТУ корня, а не по узлу: обёртка одна на всё дерево, а не на каждый узел.
   */
  const provider = createMemo(() => {
    const read = readAddress(props.registry, tree().components.root);
    if (!read) return undefined;
    const found = props.registry.components[read.component]?.provider;
    return typeof found === "function" ? found : undefined;
  });

  const root = () => (
    <RenderNode
      nodeId={tree().components.root}
      tree={tree()}
      registry={props.registry}
      fallback={fallback()}
      errorFallback={errorFallback()}
      editOverlay={props.editOverlay}
      data={props.data}
      dispatch={props.dispatch}
    />
  );

  return (
    <Suspense fallback={props.loadingFallback}>
      <Show when={provider()} fallback={root()} keyed>
        {(Provider) =>
          createComponent(Provider as Component<Record<string, unknown>>, {
            ...(tree().components.providerProps ?? {}),
            get children() {
              return root();
            },
          })
        }
      </Show>
    </Suspense>
  );
};
