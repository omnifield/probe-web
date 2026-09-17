import type { DispatchedEvent } from "@web-core/assembly";
import type { PassportAssembly } from "@web-core/skin/editor";
import { toast } from "@web-core/ui";
import { Renderer } from "#/shared/ui/renderer";
import { componentManagerStoreOf, useComponentName } from "../../../model";

export function Form(props: { variant: string; assembly: PassportAssembly }) {
  const component = useComponentName();
  const store = componentManagerStoreOf(component);

  function dispatch(event: DispatchedEvent) {
    toast.create({
      title: event.name,
      description: JSON.stringify(event.context, null, 2),
    });
  }

  return (
    <Renderer
      component={component}
      assembly={props.assembly.name}
      variant={props.variant}
      data={store.selectors.feedData()}
      dispatch={dispatch}
    />
  );
}
