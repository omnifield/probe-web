// см. README.md / FAQ.md

import type { Component, JSX } from "solid-js";

import type { Registry } from "../engine/registry.js";
import type { AssemblyElement, AssemblyTree, DispatchedEvent, NodeId } from "../engine/tree.js";

export type SlotPlacement = "before" | "after" | "replace";

export interface SlotEntry {
  readonly render: (resolved: Record<string, unknown>) => JSX.Element;
  readonly placement?: SlotPlacement;
}

export interface FallbackProps {
  readonly type: string;
  readonly nodeId: NodeId;
}

export interface ErrorFallbackProps {
  readonly type: string;
  readonly nodeId: NodeId;
  readonly error: unknown;
  readonly reset: () => void;
}

export interface EditOverlayProps {
  readonly nodeId: NodeId;
  readonly node: AssemblyElement;
}

export interface RenderTreeProps {
  tree?: AssemblyTree;
  registry: Registry;
  fallback?: Component<FallbackProps>;
  errorFallback?: Component<ErrorFallbackProps>;
  loadingFallback?: JSX.Element;
  editOverlay?: Component<EditOverlayProps>;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
  slots?: Readonly<Record<string, SlotEntry>>;
  rootProps?: Readonly<Record<string, unknown>>;
}

/** Внутренний проп-контракт `RenderNode` — не часть публичной поверхности пакета. */
export interface RenderNodeProps {
  nodeId: NodeId;
  tree: AssemblyTree;
  registry: Registry;
  fallback: Component<FallbackProps>;
  errorFallback: Component<ErrorFallbackProps>;
  editOverlay?: Component<EditOverlayProps>;
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
  slots?: Readonly<Record<string, SlotEntry>>;
  rootProps?: Readonly<Record<string, unknown>>;
}

/** Снимок «по чему решаем, монтировать ли узел заново» — держит `<Mounted>` стабильным между
 * пересборками дерева, пока тип/род/фолбэк не поменялись. Внутренний тип, не публичный. */
export interface RenderSignature {
  type: string | undefined;
  genus: string | undefined;
  fallback: Component<FallbackProps>;
}
