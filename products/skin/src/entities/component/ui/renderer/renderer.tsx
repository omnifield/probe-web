import { RenderTree, type DispatchedEvent } from "@omnifield/probe-web-assembly";
import { kitComponentRenderer } from "@omnifield/probe-web-ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function Renderer(props: {
  component: string;
  assembly?: string;
  variant?: string;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
}) {
  const tree = () =>
    instanceOf(
      props.component,
      props.variant === undefined ? {} : { "data-variant": props.variant },
      props.assembly,
      props.data,
    );

  return (
    <RenderTree
      tree={tree()}
      registry={registry}
      data={props.data}
      dispatch={props.dispatch}
    />
  );
}
