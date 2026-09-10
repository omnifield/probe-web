// см. README.md / FAQ.md

import { type Component, createMemo, ErrorBoundary, For, type JSX, mergeProps } from "solid-js";
import { createComponent } from "solid-js/web";

import { isContent } from "../engine/tree.js";
import { trace } from "../shared/trace.js";
import { assembleComponent, createOuterComponent, createResolvedComponent } from "./composition.js";
import { createContentOf } from "./content-of.js";
import { typeOrGenus, valueOf } from "./content-value.js";
import { overlay, wrapped } from "./edit-overlay.js";
import { innerDataFor, ownPropsFor } from "./props.js";
import { createSelfAssemblyTree } from "./self-assembly-branch.js";
import { takesContent } from "./takes-content.js";
import type { RenderNodeProps, RenderSignature } from "./types.js";

// см. README.md / FAQ.md — RenderTree ссылается на RenderNode рекурсивно ЧЕРЕЗ этот же модуль
// (children узла — снова узлы), поэтому конкретно этот импорт объявлен здесь, а не наверху вместе
// с остальными: избегает цикла render-tree.tsx → render-node.tsx → render-tree.tsx на уровне
// объявлений модуля (оба значения нужны только ВНУТРИ тел компонентов, не на верхнем уровне).
import { RenderTree } from "./render-tree.js";

export const RenderNode: Component<RenderNodeProps> = (props) => {
  const node = () => props.tree.components.nodes[props.nodeId];

  const resolved = createResolvedComponent(() => props.registry, node);
  const outer = createOuterComponent(() => props.registry, node);
  const selfAssemblyTree = createSelfAssemblyTree(() => props.registry, node);

  const ownProps = () => ownPropsFor(node(), props.data, props.dispatch, props.rootProps);
  const innerData = () => innerDataFor(node(), props.data);

  const identityProps = {
    get "data-node"() {
      return node()?.id ?? props.nodeId;
    },
  };

  const contentOf = createContentOf(props, node, ownProps, RenderNode);
  const assembled = () => assembleComponent(node(), resolved(), outer);

  const rendered = () => {
    const current = node();
    if (!current) return null;

    if (isContent(current)) {
      const closeContent = trace(`содержимое ${current.id} (${current.genus})`);
      try {
        return <>{valueOf(current, props.data)}</>;
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
        return EditOverlay ? wrapped(body, EditOverlay, node, props.nodeId) : body;
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
        return wrapped(body, EditOverlay, node, props.nodeId);
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
              {overlay(EditOverlay, node, props.nodeId)}
            </>
          );
        },
      });
      return createComponent(Comp as Component<Record<string, unknown>>, decoratedProps);
    } finally {
      close();
    }
  };

  // Сигнатура типа/рода/фолбэка гейтит ПОЛНОЕ перемонтирование `<Mounted>` (через `<For
  // each={[signature()]}>`) — стабильная ссылка, пока адрес узла не поменялся, значит узел не
  // пересобирается заново на каждое изменение данных, только когда РЕАЛЬНО сменился тип.
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
          type: typeOrGenus(node()),
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
