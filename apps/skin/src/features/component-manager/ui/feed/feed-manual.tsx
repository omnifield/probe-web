import { createMemo, Show } from "solid-js";
import { Tree } from "@web-core/feeder";
import { componentDescriptorOf } from "#/entities/component";
import { componentManagerStoreOf } from "../../model";

export function FeedManual(props: { component?: string }) {
  const schema = () =>
    props.component === undefined
      ? undefined
      : componentDescriptorOf(props.component)?.io?.schema;

  const store = createMemo(() =>
    componentManagerStoreOf(props.component ?? ""),
  );
  const value = createMemo(() => store().use((state) => state.feedData)());

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <Tree
          schema={schema}
          value={value()}
          onChange={(next) => store().actions.setFeedData(next)}
        />
      )}
    </Show>
  );
}
