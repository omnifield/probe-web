import { Show } from "solid-js";
import { Tree } from "@web-core/feeder";

import { componentDescriptorOf } from "#/entities/component";
import { componentManagerStore } from "../model";

export function FeedManual(props: { component?: string }) {
  const schema = () =>
    props.component === undefined
      ? undefined
      : componentDescriptorOf(props.component)?.io?.schema;

  const value = componentManagerStore.use((state) => state.feedData);

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <Tree
          schema={schema}
          value={value()}
          onChange={componentManagerStore.actions.setFeedData}
        />
      )}
    </Show>
  );
}
