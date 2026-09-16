import { createMemo } from "solid-js";
import type { DispatchedEvent } from "@web-core/assembly";
import { toast } from "@web-core/ui";
import { Renderer } from "#/shared/ui/renderer";
import { componentManagerStoreOf } from "../../../model";

export function StandForm(props: { component: string; variant: string }) {
  const feedData = createMemo(() =>
    componentManagerStoreOf(props.component).use((state) => state.feedData)(),
  );

  function dispatch(event: DispatchedEvent) {
    toast.create({
      title: event.name,
      description: JSON.stringify(event.context, null, 2),
    });
  }

  return (
    <Renderer
      component={props.component}
      variant={props.variant}
      data={feedData()}
      dispatch={dispatch}
    />
  );
}
