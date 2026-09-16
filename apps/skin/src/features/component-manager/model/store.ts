import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import type { ComponentDescriptor } from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "#/entities/component";

export type ViewMode = "style" | "assembly" | "feed" | "form";
export const VIEW_MODES: readonly ViewMode[] = [
  "style",
  "assembly",
  "feed",
  "form",
];

interface ComponentManagerState {
  readonly viewMode: ViewMode;
  readonly editorInfo?: ComponentDescriptor["editorInfo"];
  readonly io?: ComponentDescriptor["io"];
  readonly variants?: Awaited<ReturnType<typeof variantsOf>>;
  readonly content?: Awaited<ReturnType<typeof contentOf>>;
  readonly feedData?: unknown;
}

export const componentManagerStoreOf = createActionStoreFamily<
  ComponentManagerState,
  {
    setViewMode(viewMode: ViewMode): void;
    setEditorInfo(editorInfo: ComponentDescriptor["editorInfo"]): void;
    setIo(io: ComponentDescriptor["io"]): void;
    loadVariants(component: string): Promise<void>;
    loadContent(component: string): Promise<void>;
    setFeedData(feedData: unknown): void;
  }
>({ viewMode: "form" }, ({ setState }) => ({
  setViewMode(viewMode) {
    setState(
      mutate<ComponentManagerState>((draft) => {
        draft.viewMode = viewMode;
      }),
    );
  },
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
  setFeedData(feedData) {
    setState(
      mutate<ComponentManagerState>((draft) => {
        draft.feedData = castDraft(feedData);
      }),
    );
  },
}));
