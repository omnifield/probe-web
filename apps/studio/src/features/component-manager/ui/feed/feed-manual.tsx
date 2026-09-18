import { Show } from "solid-js";
// import { Tree } from "@web-core/feeder";
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
    <div>wd</div>
    // <Show when={schema()} keyed>
    //   {(schema) => (
    //     <Tree
    //       schema={schema}
    //       value={feedData()}
    //       onChange={(next) => store.actions.setFeedData(next)}
    //     />
    //   )}
    // </Show>
  );
}
