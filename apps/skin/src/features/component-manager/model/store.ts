import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import type { ComponentDescriptor } from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "#/entities/component";

interface ComponentManagerState {
  readonly editorInfo?: ComponentDescriptor["editorInfo"];
  readonly io?: ComponentDescriptor["io"];
  readonly variants?: Awaited<ReturnType<typeof variantsOf>>;
  readonly content?: Awaited<ReturnType<typeof contentOf>>;
}

export const componentManagerStoreOf = createActionStoreFamily<
  ComponentManagerState,
  {
    setEditorInfo(editorInfo: ComponentDescriptor["editorInfo"]): void;
    setIo(io: ComponentDescriptor["io"]): void;
    loadVariants(component: string): Promise<void>;
    loadContent(component: string): Promise<void>;
  }
>({}, ({ setState }) => ({
  setEditorInfo(editorInfo) {
    setState(
      mutate<ComponentManagerState>((draft) => {
        draft.editorInfo = castDraft(editorInfo);
      }),
    );
  },
  setIo(io) {
    setState(
      mutate<ComponentManagerState>((draft) => {
        draft.io = castDraft(io);
      }),
    );
  },
  async loadVariants(component) {
    const variants = await variantsOf(component);
    setState(
      mutate<ComponentManagerState>((draft) => {
        draft.variants = castDraft(variants);
      }),
    );
  },
  async loadContent(component) {
    const content = await contentOf(component);
    setState(
      mutate<ComponentManagerState>((draft) => {
        draft.content = castDraft(content);
      }),
    );
  },
}));
