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
// ## Чего эта отрисовка не делает
//
// Не истолковывает `styles` — прокидывает потребителю как есть. Не решает, как выглядит узел,
// как показывается выделение и что значит «выбрано». Это вид, а вид — не предмет механики:
// она отвечает на «чем это нарисовать», а не на «что должно получиться».

import {
  type Component,
  createEffect,
  createMemo,
  ErrorBoundary,
  For,
  type JSX,
  mergeProps,
  Suspense,
} from "solid-js";
import { createComponent } from "solid-js/web";

import { checkTree } from "./integrity.js";
import { allowedInside } from "./nesting.js";
import { resolveComponent, type Registry } from "./registry.js";
import { note, trace } from "./trace.js";
import { EMPTY_TREE, type AssemblyNode, type AssemblyTree, type NodeId } from "./tree.js";

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

/** Что получает слот украшения на каждом узле. */
export interface EditOverlayProps {
  readonly nodeId: NodeId;
  readonly node: AssemblyNode;
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
  return allowed.unrestricted || allowed.parts.length > 0 || allowed.genera.length > 0;
};

interface RenderNodeProps {
  nodeId: NodeId;
  tree: AssemblyTree;
  registry: Registry;
  fallback: Component<FallbackProps>;
  errorFallback: Component<ErrorFallbackProps>;
  editOverlay?: Component<EditOverlayProps>;
}

/** Материальное для пересборки узла: сменилось — узел собирается заново, нет — живёт. */
interface RenderSignature {
  type: string | undefined;
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
    if (!current) return undefined;
    return resolveComponent(props.registry, current.type);
  });

  /** Дети узла, а если их нет — содержимое из пропов (текст листа). */
  const contentOf = () => {
    const current = node();
    if (!current) return null;
    if (current.children.length === 0) return current.props?.children as JSX.Element;

    return (
      <For each={node()?.children ?? []}>
        {(childId) => (
          <RenderNode
            nodeId={childId}
            tree={props.tree}
            registry={props.registry}
            fallback={props.fallback}
            errorFallback={props.errorFallback}
            editOverlay={props.editOverlay}
          />
        )}
      </For>
    );
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
          return node() as AssemblyNode;
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
  const ownProps = () => node()?.props ?? {};

  const rendered = () => {
    const current = node();
    if (!current) return null;

    const close = trace(`узел ${current.id} (${current.type})`);
    try {
      const Comp = resolved();
      const EditOverlay = props.editOverlay;

      // Адрес не разрешился — явный запасной вид. Украшение ему тоже полагается: узел в
      // дереве есть, и в редакторе его должно быть можно выделить и убрать.
      if (!Comp) {
        const body = createComponent(props.fallback, { type: current.type, nodeId: current.id });
        return EditOverlay ? wrapped(body, EditOverlay) : body;
      }

      // Обычный путь: украшения нет — нет и ветвлений.
      if (!EditOverlay) {
        const plainProps = mergeProps(ownProps, {
          get meta() {
            return node()?.meta;
          },
          get styles() {
            // Механика `styles` не истолковывает: как их применить — смешать в класс, отдать
            // атрибутом, не заметить вовсе — решает тот, кому узел принадлежит.
            return node()?.styles;
          },
          get children() {
            return contentOf();
          },
        });
        return createComponent(Comp as Component<Record<string, unknown>>, plainProps);
      }

      // Узел не пускает содержимое — украшение идёт снаружи, обёрткой.
      if (!takesContent(props.registry, current.type)) {
        const closedProps = mergeProps(ownProps, {
          get meta() {
            return node()?.meta;
          },
          get styles() {
            return node()?.styles;
          },
        });
        const body = createComponent(Comp as Component<Record<string, unknown>>, closedProps);
        return wrapped(body, EditOverlay);
      }

      // Узел пускает содержимое — украшение идёт внутрь, ПОСЛЕ настоящих детей. Раскладку оно
      // не двигает: украшение позиционировано абсолютно, а узлу навязывается только
      // `position:relative` — без него абсолютной привязке не за что зацепиться.
      const decoratedProps = mergeProps(ownProps, {
          get style() {
            const own = (node()?.props as { style?: unknown } | undefined)?.style;
            if (typeof own === "string") return `position:relative; ${own}`;
            if (own && typeof own === "object") return { position: "relative", ...own };
            return "position:relative";
          },
          get meta() {
            return node()?.meta;
          },
          get styles() {
            return node()?.styles;
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
    const next: RenderSignature = { type: node()?.type, fallback: props.fallback };
    if (!previous) return next;
    if (previous.type !== next.type) return next;
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
          type: node()?.type ?? "неизвестен",
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

  return (
    <Suspense fallback={props.loadingFallback}>
      <RenderNode
        nodeId={tree().components.root}
        tree={tree()}
        registry={props.registry}
        fallback={fallback()}
        errorFallback={errorFallback()}
        editOverlay={props.editOverlay}
      />
    </Suspense>
  );
};
