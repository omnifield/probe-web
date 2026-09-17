import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import type { ComponentDescriptor } from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "#/entities/component";
import type { Cell } from "../lib/cell";
import { DEFAULT_AXIS_MODE, DEFAULT_LAYOUT_MODE, type AxisMode, type LayoutMode, type ViewMode } from "./modes";

export type CellKey = string;
export const ALL_CELLS: CellKey = "*";

interface ComponentManagerState {
  readonly editorInfo?: ComponentDescriptor["editorInfo"];
  readonly io?: ComponentDescriptor["io"];
  readonly variants?: Awaited<ReturnType<typeof variantsOf>>;
  readonly content?: Awaited<ReturnType<typeof contentOf>>;
  readonly layoutMode: LayoutMode;
  readonly axisMode: AxisMode;
  readonly viewMode: Readonly<Record<CellKey, ViewMode>>;
  readonly feedData: Readonly<Record<CellKey, unknown>>;
}

export const componentManagerStoreOf = createActionStoreFamily<
  ComponentManagerState,
  {
    setLayoutMode(layoutMode: LayoutMode): void;
    setAxisMode(axisMode: AxisMode): void;
    setViewMode(viewMode: ViewMode, cell?: Cell): void;
    setEditorInfo(editorInfo: ComponentDescriptor["editorInfo"]): void;
    setIo(io: ComponentDescriptor["io"]): void;
    loadVariants(component: string): Promise<void>;
    loadContent(component: string): Promise<void>;
    setFeedData(feedData: unknown, cell?: Cell): void;
  },
  {
    viewMode(state: ComponentManagerState, cell: Cell): ViewMode;
    feedData(state: ComponentManagerState, cell: Cell): unknown;
    variantAt(state: ComponentManagerState, cell: Cell): NonNullable<ComponentManagerState["variants"]>[number] | undefined;
    assemblyAt(state: ComponentManagerState, cell: Cell): NonNullable<ComponentManagerState["editorInfo"]>["assemblies"][number] | undefined;
  }
>(
  {
    layoutMode: DEFAULT_LAYOUT_MODE,
    axisMode: DEFAULT_AXIS_MODE,
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
    setAxisMode(axisMode) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.axisMode = axisMode;
        }),
      );
    },
    setViewMode(viewMode, cell) {
      const key = cell?.id ?? ALL_CELLS;
      setState(
        mutate<ComponentManagerState>((draft) => {
          if (key === ALL_CELLS) {
            draft.viewMode = { [ALL_CELLS]: viewMode };
          } else {
            draft.viewMode[key] = viewMode;
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
    setFeedData(feedData, cell) {
      const key = cell?.id ?? ALL_CELLS;
      setState(
        mutate<ComponentManagerState>((draft) => {
          if (key === ALL_CELLS) {
            draft.feedData = { [ALL_CELLS]: castDraft(feedData) };
          } else {
            draft.feedData[key] = castDraft(feedData);
          }
        }),
      );
    },
  }),
  () => ({
    viewMode(state, cell) {
      return state.viewMode[cell.id] ?? state.viewMode[ALL_CELLS] ?? "form";
    },
    feedData(state, cell) {
      return state.feedData[cell.id] ?? state.feedData[ALL_CELLS];
    },
    variantAt(state, cell) {
      const variants = state.variants ?? [];
      return state.axisMode === "variant" ? variants[cell.index] : variants[0];
    },
    assemblyAt(state, cell) {
      const assemblies = state.editorInfo?.assemblies ?? [];
      return state.axisMode === "assembly" ? assemblies[cell.index] : assemblies[0];
    },
  }),
);
