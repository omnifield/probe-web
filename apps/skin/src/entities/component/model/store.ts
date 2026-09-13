import { createActionStore } from "@web-core/store";
import type { VariantSummary } from "@web-core/skin/presets";

import { variantsOf } from "../api/presets";

interface VariantsState {
  readonly status: "idle" | "pending" | "done" | "error";
  readonly data?: readonly VariantSummary[];
  readonly error?: unknown;
}

interface ComponentState {
  readonly component?: string;
  readonly outfit?: string;
  readonly variants: VariantsState;
}

let requestId = 0;

export const componentStore = createActionStore<
  ComponentState,
  {
    setComponent(name: string): void;
    setOutfit(name: string | undefined): void;
    loadVariants(): Promise<void>;
  }
>({ variants: { status: "idle" } }, ({ setState, get }) => {
  async function loadVariants() {
    const { component, outfit } = get();
    if (component === undefined || outfit === undefined) return;

    const id = ++requestId;
    setState((state) => ({ ...state, variants: { status: "pending" } }));
    try {
      const data = await variantsOf(outfit, component);
      if (id !== requestId) return;
      setState((state) => ({ ...state, variants: { status: "done", data } }));
    } catch (error) {
      if (id !== requestId) return;
      setState((state) => ({ ...state, variants: { status: "error", error } }));
    }
  }

  return {
    setComponent(name) {
      setState((state) => ({ ...state, component: name }));
      void loadVariants();
    },
    setOutfit(name) {
      setState((state) => ({ ...state, outfit: name }));
      void loadVariants();
    },
    loadVariants,
  };
});
