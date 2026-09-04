import { RenderTree, type DispatchedEvent } from "@web-core/assembly";
import { kitComponentRenderer } from "@web-core/ui/component-registry";
import { createMemo } from "solid-js";

const { registry, instanceOf } = kitComponentRenderer();

export function Renderer(props: {
  component: string;
  assembly?: string;
  variant?: string;
  rootProps?: Readonly<Record<string, unknown>>;
  liveProps?: Readonly<Record<string, unknown>>;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
}) {
  const tree = createMemo(() =>
    instanceOf(
      props.component,
      {
        ...(props.variant === undefined ? {} : { "data-variant": props.variant }),
        ...props.rootProps,
      },
      props.assembly,
      props.data,
    ),
  );

  return (
    <RenderTree
      tree={tree()}
      registry={registry}
      data={props.data}
      dispatch={props.dispatch}
      rootProps={props.liveProps}
    />
  );
}
