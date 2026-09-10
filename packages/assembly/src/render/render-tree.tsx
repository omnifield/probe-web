// см. README.md / FAQ.md

import { type Component, createEffect, createMemo, Show, Suspense } from "solid-js";
import { createComponent } from "solid-js/web";

import { checkTree } from "../engine/integrity.js";
import { readAddress } from "../engine/registry.js";
import { EMPTY_TREE } from "../engine/tree.js";
import { note } from "../shared/trace.js";
import { DefaultErrorFallback, DefaultFallback } from "./defaults.js";
import { RenderNode } from "./render-node.js";
import type { RenderTreeProps } from "./types.js";

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
