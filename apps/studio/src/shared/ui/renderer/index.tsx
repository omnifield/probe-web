import { createMemo } from "solid-js";
import {
  type CompositionElement,
  composeTree,
  type DispatchedEvent,
} from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function Renderer(props: {
  /** Не задан, когда рендерим композицию — тогда дерево строит {@link composition}. */
  component?: string;
  assembly?: string;
  variant?: string;
  rootProps?: Readonly<Record<string, unknown>>;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
  /** Модуль из целых компонентов (`composeTree`) — задан вместо {@link component}. */
  composition?: CompositionElement;
}) {
  const tree = createMemo(() => {
    const composition = props.composition;
    if (composition) {
      const result = composeTree(registry, composition);
      if (!result.ok) {
        throw new Error(
          `композиция не собралась: ${result.refusals.map((refusal) => `«${refusal.id}» — ${refusal.means}`).join("; ")}`,
        );
      }
      return result.tree;
    }

    if (props.component === undefined) {
      throw new Error("Renderer: нужен либо component, либо composition");
    }

    return instanceOf(
      props.component,
      {
        ...(props.variant === undefined
          ? {}
          : { "data-variant": props.variant }),
        ...props.rootProps,
      },
      props.assembly,
      props.data,
    );
  });

  return (
    <RenderTree
      tree={tree()}
      registry={registry}
      data={props.data}
      dispatch={props.dispatch}
    />
  );
}
