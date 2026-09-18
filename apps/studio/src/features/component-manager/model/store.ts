import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import type { ComponentDescriptor } from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "#/entities/component";
import type { Cell } from "../lib/cell";
import {
  DEFAULT_AXIS_MODE,
  DEFAULT_FILTER_MODE,
  DEFAULT_LAYOUT_MODE,
  type AxisMode,
  type FilterMode,
  type LayoutMode,
  type ViewMode,
} from "./modes";

export type CellKey = string;
export const ALL_CELLS: CellKey = "*";

function primaryIndexAt(cell: Cell): number {
  return cell.primary;
}

function secondaryScopeOf(
  state: Pick<ComponentManagerState, "layoutMode">,
  cell: Cell,
): CellKey {
  return state.layoutMode === "matrix" ? cell.group : cell.id;
}

function secondaryIndexAt(
  state: Pick<ComponentManagerState, "secondaryIndex" | "layoutMode">,
  cell: Cell,
): number {
  return state.secondaryIndex[secondaryScopeOf(state, cell)] ?? 0;
}

interface ComponentManagerState {
  readonly editorInfo?: ComponentDescriptor["editorInfo"];
  readonly io?: ComponentDescriptor["io"];
  readonly variants?: Awaited<ReturnType<typeof variantsOf>>;
  readonly content?: Awaited<ReturnType<typeof contentOf>>;
  readonly layoutMode: LayoutMode;
  readonly axisMode: AxisMode;
  readonly filterMode: FilterMode;
  readonly viewMode: Readonly<Record<CellKey, ViewMode>>;
  readonly feedData: Readonly<Record<CellKey, unknown>>;
  readonly secondaryIndex: Readonly<Record<CellKey, number>>;
}

export const componentManagerStoreOf = createActionStoreFamily<
  ComponentManagerState,
  {
    setLayoutMode(layoutMode: LayoutMode): void;
    setAxisMode(axisMode: AxisMode): void;
    setFilterMode(filterMode: FilterMode): void;
    setViewMode(viewMode: ViewMode, cell?: Cell): void;
    setEditorInfo(editorInfo: ComponentDescriptor["editorInfo"]): void;
    setIo(io: ComponentDescriptor["io"]): void;
    loadVariants(component: string): Promise<void>;
    loadContent(component: string): Promise<void>;
    setFeedData(feedData: unknown, cell?: Cell): void;
    setSecondaryIndex(index: number, cell: Cell): void;
  },
  {
    viewMode(state: ComponentManagerState, cell: Cell): ViewMode;
    feedData(state: ComponentManagerState, cell: Cell): unknown;
    secondaryIndex(state: ComponentManagerState, cell: Cell): number;
    variantAt(state: ComponentManagerState, cell: Cell): NonNullable<ComponentManagerState["variants"]>[number] | undefined;
    assemblyAt(state: ComponentManagerState, cell: Cell): NonNullable<ComponentManagerState["editorInfo"]>["assemblies"][number] | undefined;
  }
>(
  {
    layoutMode: DEFAULT_LAYOUT_MODE,
    axisMode: DEFAULT_AXIS_MODE,
    filterMode: DEFAULT_FILTER_MODE,
    viewMode: { [ALL_CELLS]: "form" },
    feedData: {},
    secondaryIndex: {},
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
    setFilterMode(filterMode) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.filterMode = filterMode;
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
    setSecondaryIndex(index, cell) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.secondaryIndex[secondaryScopeOf(draft, cell)] = index;
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
    secondaryIndex(state, cell) {
      return secondaryIndexAt(state, cell);
    },
    variantAt(state, cell) {
      const variants = state.variants ?? [];
      const index = state.axisMode === "variant" ? primaryIndexAt(cell) : secondaryIndexAt(state, cell);
      return variants[index];
    },
    assemblyAt(state, cell) {
      const assemblies = state.editorInfo?.assemblies ?? [];
      const index = state.axisMode === "assembly" ? primaryIndexAt(cell) : secondaryIndexAt(state, cell);
      return assemblies[index];
    },
  }),
);
