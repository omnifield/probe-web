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

  const contentCache: { memo?: () => JSX.Element | null } = {};
  const contentOf = (): JSX.Element | null => {
    if (!contentCache.memo) {
      contentCache.memo = createMemo(() => {
        const current = node();
        if (!current) return null;

        const declared =
          current.children.length === 0 ? null : (
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

        const entry = !isContent(current) ? props.slots?.[current.type] : undefined;
        if (!entry) return declared;

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
