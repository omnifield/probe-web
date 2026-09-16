import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

interface FeedState {
  readonly feedData?: unknown;
  readonly presetName?: string;
}

export const componentManagerStoreOf = createActionStoreFamily<
  FeedState,
  {
    setFeedData(value: unknown): void;
    setPreset(name: string, data: unknown): void;
  }
>({}, ({ setState }) => ({
  setFeedData(value) {
    setState(
      mutate<FeedState>((draft) => {
        draft.feedData = castDraft(value);
      }),
    );
  },
  setPreset(name, data) {
    setState(
      mutate<FeedState>((draft) => {
        draft.presetName = name;
        draft.feedData = castDraft(data);
      }),
    );
  },
}));
