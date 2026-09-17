import { Show } from "solid-js";
import { Tree } from "@web-core/feeder";
import { componentManagerStoreOf, useComponentName } from "../../model";

export function FeedManual() {
  const store = componentManagerStoreOf(useComponentName());
  const schema = store.use((state) => state.io?.schema);
  const value = store.selectors.feedData;

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <Tree
          schema={schema}
          value={value()}
          onChange={(next) => store.actions.setFeedData(next)}
        />
      )}
    </Show>
  );
}
