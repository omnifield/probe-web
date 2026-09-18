import { Show } from "solid-js";
import { TreeForm } from "@web-core/feeder";
import {
  ALL_CELLS,
  componentManagerStoreOf,
  useComponentName,
} from "../../model";

export function FeedManual() {
  const store = componentManagerStoreOf(useComponentName());
  const schema = store.use((state) => state.io?.schema);
  const feedData = store.use((state) => state.feedData[ALL_CELLS]);

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <TreeForm
          schema={schema}
          value={feedData()}
          onChange={(next) => store.actions.setFeedData(next)}
        />
      )}
    </Show>
  );
}
