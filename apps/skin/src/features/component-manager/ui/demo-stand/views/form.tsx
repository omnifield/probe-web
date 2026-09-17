import { createMemo } from "solid-js";
import type { DispatchedEvent } from "@web-core/assembly";
import { toast } from "@web-core/ui";
import { Renderer } from "#/shared/ui/renderer";
import { ALL_CELLS, componentManagerStoreOf } from "../../../model";

export function Form(props: { component: string; variant: string }) {
  const feedData = createMemo(() =>
    componentManagerStoreOf(props.component).use(
      (state) => state.feedData[props.variant] ?? state.feedData[ALL_CELLS],
    )(),
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
