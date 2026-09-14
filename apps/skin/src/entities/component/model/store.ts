import { createActionStore } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import type { VariantSummary } from "@web-core/skin/presets";
import { groupByTag, type TagGroup } from "@web-core/skin/tags";
import {
  componentDescriptorOf,
  type ComponentDescriptor,
} from "@web-core/ui/component-info";

import { assembliesOf, variantsOf } from "../api/presets";

interface VariantsState {
  readonly data?: readonly VariantSummary[];
}

interface AssembliesState {
  readonly data?: Awaited<ReturnType<typeof assembliesOf>>;
}

interface ComponentState {
  readonly component?: string;
  readonly outfit?: string;
  readonly kit?: ComponentDescriptor;
  readonly variants: VariantsState;
  readonly assemblies: AssembliesState;
}

export const componentStore = createActionStore<
  ComponentState,
  {
    setComponent(name: string): void;
    setOutfit(name: string | undefined): void;
    loadVariants(): Promise<void>;
    loadAssemblies(): Promise<void>;
  },
  {
    variantsByTag(state: ComponentState): readonly TagGroup[];
  }
>(
  { variants: {}, assemblies: {} },
  ({ setState, get }) => {
    async function loadVariants() {
      const { component, outfit } = get();
      if (component === undefined || outfit === undefined) return;

      const data = await variantsOf(outfit, component);
      setState(
        mutate<ComponentState>((draft) => {
          draft.variants = castDraft({ data });
        }),
      );
    }

    async function loadAssemblies() {
      const { component } = get();
      if (component === undefined) return;

      const data = await assembliesOf(component);
      setState(
        mutate<ComponentState>((draft) => {
          draft.assemblies = castDraft({ data });
        }),
      );
    }

    return {
      setComponent(component) {
        setState(
          mutate<ComponentState>((draft) => {
            draft.component = component;
            draft.kit = castDraft(componentDescriptorOf(component));
          }),
        );
        void loadVariants();
        void loadAssemblies();
      },
      setOutfit(outfit) {
        setState(
          mutate<ComponentState>((draft) => {
            draft.outfit = outfit;
          }),
        );
        void loadVariants();
      },
      loadVariants,
      loadAssemblies,
    };
  },
  () => ({
    variantsByTag(state) {
      return groupByTag(state.variants.data ?? []);
    },
  }),
);
