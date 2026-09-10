// см. README.md / FAQ.md

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
  untrack,
} from "solid-js";
import { createComponent } from "solid-js/web";

import { checkTree } from "../engine/integrity.js";
import { allowedInside } from "../engine/nesting.js";
import { readAddress, resolveComponent, type Registry } from "../engine/registry.js";
import { growSelfAssembly } from "../engine/self-assembly.js";
import {
  EMPTY_TREE,
  isContent,
  isDataBinding,
  resolveDataBinding,
  type AssemblyElement,
  type AssemblyTree,
  type DispatchedEvent,
  type NodeId,
} from "../engine/tree.js";
import { note, trace } from "../shared/trace.js";

export type SlotPlacement = "before" | "after" | "replace";

export interface SlotEntry {
  readonly render: (resolved: Record<string, unknown>) => JSX.Element;
  readonly placement?: SlotPlacement;
}

export interface FallbackProps {
  readonly type: string;
  readonly nodeId: NodeId;
}

export interface ErrorFallbackProps {
  readonly type: string;
  readonly nodeId: NodeId;
  readonly error: unknown;
  readonly reset: () => void;
}

export interface EditOverlayProps {
  readonly nodeId: NodeId;
  readonly node: AssemblyElement;
}

export interface RenderTreeProps {
  tree?: AssemblyTree;
  registry: Registry;
  fallback?: Component<FallbackProps>;
  errorFallback?: Component<ErrorFallbackProps>;
  loadingFallback?: JSX.Element;
  editOverlay?: Component<EditOverlayProps>;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
  slots?: Readonly<Record<string, SlotEntry>>;
  rootProps?: Readonly<Record<string, unknown>>;
}

const DefaultFallback: Component<FallbackProps> = (props) => {
  createEffect(() => {
    note(`адрес «${props.type}» не разрешён — узел «${props.nodeId}» не нарисован`);
  });
  return null;
};

const DefaultErrorFallback: Component<ErrorFallbackProps> = (props) => {
  createEffect(() => {
    console.error(
      `[web-core-assembly] узел «${props.nodeId}» (${props.type}) упал при отрисовке:`,
      props.error,
    );
  });
  return null;
};

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
  slots?: Readonly<Record<string, SlotEntry>>;
  rootProps?: Readonly<Record<string, unknown>>;
}

interface RenderSignature {
  type: string | undefined;
  genus: string | undefined;
  fallback: Component<FallbackProps>;
}

const RenderNode: Component<RenderNodeProps> = (props) => {
  const node = () => props.tree.components.nodes[props.nodeId];

  const resolved = createMemo(() => {
    const current = node();
    if (!current || isContent(current)) return undefined;
    return resolveComponent(props.registry, current.type);
  });

  const selfAssemblyTree = createMemo((): AssemblyTree | undefined => {
    const current = node();
    if (!current || isContent(current) || current.parentId === null) return undefined;

    const read = readAddress(props.registry, current.type);
    if (!read || read.part !== read.passport.root || !read.passport.selfAssembly) return undefined;

    return growSelfAssembly(read.passport.selfAssembly, read.address, read.passport.root);
  });

  const valueOf = () => {
    const current = node();
    if (!current || !isContent(current)) return "";

    const value = current.value;
    if (!isDataBinding(value)) return value;

    const resolved = resolveDataBinding(props.data, value.path);
    return typeof resolved === "string" ? resolved : (resolved?.toString() ?? "");
  };

  const typeOrGenus = () => {
    const current = node();
    if (!current) return "неизвестен";
    return isContent(current) ? `содержимое:${current.genus}` : current.type;
  };

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
          return node() as AssemblyElement;
        },
      })}
    </span>
  );

  const wrapped = (body: JSX.Element, EditOverlay: Component<EditOverlayProps>) => (
    <span style={{ display: "block", position: "relative" }}>
      {body}
      {overlay(EditOverlay)}
    </span>
  );

  const DOM_EVENT_PROP: Readonly<Record<string, string>> = {
    click: "onClick",
    change: "onChange",
    input: "onInput",
    submit: "onSubmit",
  };

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

    return { ...current.props, ...resolvedBind(current.bind), ...dispatchHandlers(), ...props.rootProps };
  };

  // `declared` собирается ОДИН РАЗ, СНАРУЖИ мемо (`each` внутри несёт свой геттер — сам остаётся
  // реактивным). Две ловушки, обе найдены эмпирически (PWEB, 2026-09-06):
  //
  // 1) Если строить `<For>`+детей ВНУТРИ тела мемо (даже за ленивым `if (declared === undefined)`),
  //    они попадают в число «усыновлённых» этим самым мемо на первом заходе — а Solid при КАЖДОМ
  //    следующем пересчёте мемо сперва диспоузит всё усыновлённое на прошлом заходе, ПУСТЬ ДАЖЕ
  //    выход мемо не поменяется. Вторая пересборка дерева уже попадает на мёртвых детей.
  // 2) Проверка «есть ли вообще дети» не может читать `node()` СНАРУЖИ мемо напрямую (реактивно)
  //    — тогда эта подписка на `props.tree` утекает потребителю `props.children`, тот сам
  //    переподписывается на каждую пересборку, и ТА ЖЕ история — Solid диспоузит усыновлённое им
  //    (сам мемо, созданный внутри) при каждой такой переподписке. Отсюда `untrack`: снимок
  //    структуры берём один раз, без подписки, а не через `node()` в теле функции контейнера.
  //
  // Итог: мемо ниже читает `node()` только ради решения «слот или объявленное», это единственная
  // его настоящая реактивная зависимость; сам вывод стабилен, пока слот не поменялся, поэтому
  // потребитель `props.children` не видит «мемо поменялся» на каждую пересборку и не диспоузит
  // сам мемо. Пусто — `null`, не пустой `<For>`: чужие компоненты различают их (Ark-паттерн
  // `props.children ?? "*"` — пустой `<For>` truthy, дефолт молча не срабатывает).
  //
  // Ветка null-vs-`<For>` — ДВА независимых критерия, не один, каждый решает свой вопрос:
  //
  // 1) МОЖЕТ ли эта часть вообще принимать контент — `takesContent(registry, type)`,
  //    СТРУКТУРНОЕ свойство адреса из реестра (тот же тест уже стоит на строке ниже для
  //    оверлея), решает, строить ли `declared` (`<For>`) ВООБЩЕ. Часть, закрытая по реестру
  //    (например trigger), получает `declared = null` раз и навсегда — `<For>` для нeё не
  //    заводится, дальше вопрос не в этом файле.
  // 2) ЕСТЬ ли у неё дети ПРЯМО СЕЙЧАС — `cur.children.length === 0`, решает, отдать `declared`
  //    (если он вообще есть) или `null` для ЭТОГО прохода. Эта проверка живёт ВНУТРИ тела
  //    `createMemo` (где и так уже читается `node()` ради слота) — не нарушает ловушку 2) выше,
  //    та про чтение `node()` СНАРУЖИ мемо, а не про чтение внутри его собственного тела, которое
  //    и так уже реактивная зависимость мемо. Мемо честно пересчитывается на каждую пересборку
  //    дерева и может вернуть то `null`, то `declared` — обе ветки стабильные ссылки
  //    (`null === null`, `declared === declared`, JSX объекта не пересоздаёт), значит потребитель
  //    `props.children` видит «мемо поменялось» ровно тогда, когда решение РЕАЛЬНО поменялось
  //    (пусто↔непусто), и не переподписывается вхолостую — ловушка 1) тоже не нарушена, `<For>`
  //    как строился один раз СНАРУЖИ мемо, так и продолжает.
  //
  // Было (первая версия, PWEB-2026-09-10, коммит 4b5ce9a): критерий 2) отсутствовал вовсе —
  // `declared` отдавался как есть, стоило пройти критерий 1). Чинило репро-баг `select`'а (см.
  // ниже), но ломало реальный кит: `field`'s `requiredIndicator` и `table`'s заголовки — части,
  // которые ПО РЕЕСТРУ принимают контент (критерий 1 = true), но у конкретного узла нет ни
  // одного ребёнка НИКОГДА (не `repeat`, просто по условию — необязательное поле, невключённая
  // сортировка). Раньше (до самого первого бага) такие части получали `null` case
  // `children.length === 0` на первом чтении — Ark-паттерн `props.children ?? "*"` срабатывал.
  // Первая версия фикса стала ВСЕГДА отдавать `declared` (пустой, но truthy `<For>`) для любой
  // структурно-открытой части — дефолт `field`/`table` молча переставал срабатывать, найдено
  // architect'ом `pnpm --filter @web-core/ui test` (270/275, не 275/275) при ревью, см.
  // `content-of-null-vs-for-breaks-ark-native-defaults` в ROADMAP.yaml.
  //
  // Изначальный баг (`content-of-null-vs-for-by-structure`, ROADMAP.yaml): узел монтируется
  // раньше, чем `repeat` успевает развернуть детей (данные ещё не приехали), `children.length` на
  // первом чтении — 0. Критерий 2), в отличие от ПЕРВОЙ версии этого фикса, не кэшируется —
  // читается заново на каждую пересборку дерева ВНУТРИ мемо, значит «пусто на монтировании, потом
  // приехали данные» и «пусто навсегда» больше не путаются: первое даёт `null`→`declared` по мере
  // прихода данных, второе — стабильный `null` всегда. Заявка owner-skin-app (2026-09-10,
  // `apps/skin/test/render-tree-repeat-reactivity.test.tsx`): переход `select`'s `content` 0
  // items → N items после монтирования не подхватывался у select (`item` — потомок `content`
  // внутри `positioner`), у `radio-group` (`item` — прямой потомок `root`) — подхватывался; рост
  // уже непустого списка (1→2) работал у обоих (там `children.length` на первом чтении уже был
  // ненулевым). Голый репро (`test/contentof-null-vs-for.test.tsx`) доказал: дело не в глубине
  // вложенности и не в `Portal` — оба ловили баг одинаково при старой (без критерия 2) проверке.
  const contentCache: { memo?: () => JSX.Element | null } = {};
  const contentOf = (): JSX.Element | null => {
    if (!contentCache.memo) {
      const current = untrack(node);
      const declared =
        !current || isContent(current) || !takesContent(props.registry, current.type) ? null : (
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
                slots={props.slots}
              />
            )}
          </For>
        );

      contentCache.memo = createMemo(() => {
        const cur = node();
        if (!cur) return null;

        const entry = !isContent(cur) ? props.slots?.[cur.type] : undefined;
        if (!entry) return cur.children.length === 0 ? null : declared;

        const rendered = entry.render(ownProps());
        const placement = entry.placement ?? "replace";
        if (placement === "before") return <>{rendered}{declared}</>;
        if (placement === "after") return <>{declared}{rendered}</>;
        return rendered;
      });
    }
    return contentCache.memo();
  };

  const innerData = () => {
    const current = node();
    if (!current || isContent(current)) return undefined;
    return { ...current.props, ...resolvedBind(current.bind) };
  };

  const identityProps = {
    get "data-node"() {
      return node()?.id ?? props.nodeId;
    },
  };

  const outer = createMemo(() => {
    const current = node();
    const composed = current && !isContent(current) ? current.composedInto : undefined;
    if (composed === undefined) return undefined;
    return resolveComponent(props.registry, composed);
  });

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
            slots={props.slots}
          />
        );
      }

      const built = assembled();
      const EditOverlay = props.editOverlay;

      if (built.kind === "missing") {
        const body = createComponent(props.fallback, { type: built.type, nodeId: current.id });
        return EditOverlay ? wrapped(body, EditOverlay) : body;
      }

      const Comp = built.Comp;
      const composition = built.composition ?? {};

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

      if (!takesContent(props.registry, current.type)) {
        const closedProps = mergeProps(ownProps, composition, identityProps, {
          get meta() {
            return node()?.meta;
          },
        });
        const body = createComponent(Comp as Component<Record<string, unknown>>, closedProps);
        return wrapped(body, EditOverlay);
      }

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

export const RenderTree: Component<RenderTreeProps> = (props) => {
  const tree = () => props.tree ?? EMPTY_TREE;
  const fallback = () => props.fallback ?? DefaultFallback;
  const errorFallback = () => props.errorFallback ?? DefaultErrorFallback;

  const told = new Set<string>();
  createEffect(() => {
    for (const flaw of checkTree(tree())) {
      const key = `${flaw.flaw}:${flaw.nodeId}:${flaw.relatedId ?? ""}`;
      if (told.has(key)) continue;
      told.add(key);
      note(`изъян ${flaw.flaw}: ${flaw.means}`);
    }
  });

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
      slots={props.slots}
      rootProps={props.rootProps}
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
