import {
  SplitterPanel as ArkPanel,
  SplitterResizeTrigger as ArkResizeTrigger,
  SplitterResizeTriggerIndicator as ArkResizeTriggerIndicator,
  SplitterRoot as ArkRoot,
  type SplitterPanelProps as ArkPanelProps,
  type SplitterResizeTriggerIndicatorProps as ArkResizeTriggerIndicatorProps,
  type SplitterResizeTriggerProps as ArkResizeTriggerProps,
  type SplitterRootProps as ArkRootProps,
} from "@ark-ui/solid/splitter";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Splitter — resizable panels with a draggable handle between each pair, from Ark
// (`ark-ui.com/docs/components/splitter`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported through
// `../entity/anatomy.ts`), the address is set by Ark itself (spreads `parts.*.attrs` inside every
// `getXxxProps()`, `splitter.connect.mjs`), wrappers are thin, `dropAddress` strips any address
// arriving from OUTSIDE so a node never lies about what it is (`PWEB-46`).
//
// `panel`/`resizeTrigger` both carry a required `id` — the machine matches panels to the `panels`
// prop's own array BY id, not by DOM order (`../entity/anatomy.ts`'s own header). A resize
// trigger's `id` is the composite `"${beforeId}:${afterId}"` of the two panels it sits between.

/** Props of `Splitter` — the root. Requires `panels`: the size-constraint data, matched by id. */
export type SplitterProps = ArkRootProps;

/**
 * The splitter's root — ONE node, wraps `panel`/`resizeTrigger` pairs.
 *
 * @example
 * ```tsx
 * <Splitter panels={[{ id: "a" }, { id: "b" }]}>
 *   <SplitterPanel id="a">Left</SplitterPanel>
 *   <SplitterResizeTrigger id="a:b">
 *     <SplitterResizeTriggerIndicator />
 *   </SplitterResizeTrigger>
 *   <SplitterPanel id="b">Right</SplitterPanel>
 * </Splitter>
 * ```
 */
export function Splitter(props: SplitterProps) {
  traceLife("ui.splitter");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `SplitterPanel` — `id` is required, matched against the root's `panels` array. */
export type SplitterPanelProps = ArkPanelProps;

/** One resizable pane. */
export function SplitterPanel(props: SplitterPanelProps) {
  traceLife("ui.splitter-panel");

  return <ArkPanel {...dropAddress(props)} />;
}

/** Props of `SplitterResizeTrigger` — `id` is the composite `"beforeId:afterId"`, `disabled` is real. */
export type SplitterResizeTriggerProps = ArkResizeTriggerProps;

/** The draggable handle between two panels — a real `role="separator"`, keyboard-resizable. */
export function SplitterResizeTrigger(props: SplitterResizeTriggerProps) {
  traceLife("ui.splitter-resize-trigger");

  return <ArkResizeTrigger {...dropAddress(props)} />;
}

/** Props of `SplitterResizeTriggerIndicator`. */
export type SplitterResizeTriggerIndicatorProps = ArkResizeTriggerIndicatorProps;

/** The glyph shown inside the handle — a grip icon, whatever the consumer puts inside it. */
export function SplitterResizeTriggerIndicator(props: SplitterResizeTriggerIndicatorProps) {
  traceLife("ui.splitter-resize-trigger-indicator");

  return <ArkResizeTriggerIndicator {...dropAddress(props)} />;
}

// MAP of the splitter: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The splitter's passport together with whatever draws each of its four parts. */
export const kit = defineKitComponent(passport, {
  root: Splitter,
  panel: SplitterPanel,
  resizeTrigger: SplitterResizeTrigger,
  resizeTriggerIndicator: SplitterResizeTriggerIndicator,
});
