import { createActionStore } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

interface FeedState {
  readonly feedData?: unknown;
}

export const componentManagerStore = createActionStore<
  FeedState,
  {
    setFeedData(value: unknown): void;
  }
>({}, ({ setState }) => ({
  setFeedData(value) {
    setState(
      mutate<FeedState>((draft) => {
        draft.feedData = castDraft(value);
      }),
    );
  },
}));
