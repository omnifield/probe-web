import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import type { ComponentDescriptor } from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "#/entities/component";
import { DEFAULT_AXIS, DEFAULT_LAYOUT_MODE, type Axis, type LayoutMode, type ViewMode } from "./modes";

export type CellKey = string;
export const ALL_CELLS: CellKey = "*";

interface ComponentManagerState {
  readonly editorInfo?: ComponentDescriptor["editorInfo"];
  readonly io?: ComponentDescriptor["io"];
  readonly variants?: Awaited<ReturnType<typeof variantsOf>>;
  readonly content?: Awaited<ReturnType<typeof contentOf>>;
  readonly layoutMode: LayoutMode;
  readonly axis: Axis;
  readonly viewMode: Readonly<Record<CellKey, ViewMode>>;
  readonly feedData: Readonly<Record<CellKey, unknown>>;
}

export const componentManagerStoreOf = createActionStoreFamily<
  ComponentManagerState,
  {
    setLayoutMode(layoutMode: LayoutMode): void;
    setAxis(axis: Axis): void;
    setViewMode(viewMode: ViewMode, cell?: CellKey): void;
    setEditorInfo(editorInfo: ComponentDescriptor["editorInfo"]): void;
    setIo(io: ComponentDescriptor["io"]): void;
    loadVariants(component: string): Promise<void>;
    loadContent(component: string): Promise<void>;
    setFeedData(feedData: unknown, cell?: CellKey): void;
  },
  {
    viewMode(state: ComponentManagerState): ViewMode;
    feedData(state: ComponentManagerState): unknown;
  }
>(
  {
    layoutMode: DEFAULT_LAYOUT_MODE,
    axis: DEFAULT_AXIS,
    viewMode: { [ALL_CELLS]: "form" },
    feedData: {},
  },
  ({ setState }) => ({
    setLayoutMode(layoutMode) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.layoutMode = layoutMode;
        }),
      );
    },
    setAxis(axis) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.axis = axis;
        }),
      );
    },
    setViewMode(viewMode, cell = ALL_CELLS) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          if (cell === ALL_CELLS) {
            draft.viewMode = { [ALL_CELLS]: viewMode };
          } else {
            draft.viewMode[cell] = viewMode;
          }
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
    setFeedData(feedData, cell = ALL_CELLS) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          if (cell === ALL_CELLS) {
            draft.feedData = { [ALL_CELLS]: castDraft(feedData) };
          } else {
            draft.feedData[cell] = castDraft(feedData);
          }
        }),
      );
    },
  }),
  () => ({
    viewMode(state) {
      return state.viewMode[ALL_CELLS] ?? "form";
    },
    feedData(state) {
      return state.feedData[ALL_CELLS];
    },
  }),
);
