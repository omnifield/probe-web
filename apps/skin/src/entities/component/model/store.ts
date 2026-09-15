import { createActionStore } from "@web-core/store";
import { mutate } from "@web-core/store/mutate";

interface ComponentState {
  readonly outfit?: string;
}

export const componentStore = createActionStore<
  ComponentState,
  {
    setOutfit(name: string | undefined): void;
  }
>({}, ({ setState }) => ({
  setOutfit(outfit) {
    setState(
      mutate<ComponentState>((draft) => {
        draft.outfit = outfit;
      }),
    );
  },
}));
