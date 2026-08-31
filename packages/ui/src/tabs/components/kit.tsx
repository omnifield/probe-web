import {
  TabsRoot as ArkRoot,
  TabList as ArkList,
  TabTrigger as ArkTrigger,
  TabContent as ArkContent,
  TabIndicator as ArkIndicator,
  type TabsRootProps as ArkRootProps,
  type TabListProps as ArkListProps,
  type TabTriggerProps as ArkTriggerProps,
  type TabContentProps as ArkContentProps,
  type TabIndicatorProps as ArkIndicatorProps,
} from "@ark-ui/solid/tabs";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Tabs — one panel visible at a time, selected by a row of triggers
// (`ark-ui.com/docs/components/tabs`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's, the address is set by Ark
// itself (spreads `parts.*.attrs` inside every `getXxxProps()`, `tabs.connect.mjs`), wrappers are
// thin, `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it
// is (`PWEB-46`).
//
// Ark's own export names mix `Tabs`/`Tab` inconsistently (`TabsRoot` but `TabList`/`TabTrigger`/
// `TabContent`/`TabIndicator`) — ours do not: every wrapper below carries the full `Tabs` prefix,
// the same naming discipline as `AccordionItem`/`CheckboxControl`.

/** Props of `Tabs` — the root. */
export type TabsProps = ArkRootProps;

/**
 * The set's root — holds the selected value (`value` / `defaultValue` / `onValueChange`) and the
 * orientation.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="account">
 *   <TabsList>
 *     <TabsTrigger value="account">Account</TabsTrigger>
 *     <TabsTrigger value="billing">Billing</TabsTrigger>
 *     <TabsIndicator />
 *   </TabsList>
 *   <TabsContent value="account">Account settings</TabsContent>
 *   <TabsContent value="billing">Billing settings</TabsContent>
 * </Tabs>
 * ```
 */
export function Tabs(props: TabsProps) {
  traceLife("ui.tabs");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `TabsList`. */
export type TabsListProps = ArkListProps;

/** Wraps the triggers (and the indicator, sharing their positioning context) — ONE node. */
export function TabsList(props: TabsListProps) {
  traceLife("ui.tabs-list");

  return <ArkList {...dropAddress(props)} />;
}

/** Props of `TabsTrigger`. */
export type TabsTriggerProps = ArkTriggerProps;

/** One tab's button — ONE real `<button>` node; `value` is required. */
export function TabsTrigger(props: TabsTriggerProps) {
  traceLife("ui.tabs-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `TabsContent`. */
export type TabsContentProps = ArkContentProps;

/** One tab's panel — ONE node; hidden, not removed, while its tab is not selected. */
export function TabsContent(props: TabsContentProps) {
  traceLife("ui.tabs-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `TabsIndicator`. */
export type TabsIndicatorProps = ArkIndicatorProps;

/**
 * The sliding indicator — ONE node, measured and positioned by the kit under the selected
 * trigger. No graphic of its own: the look (color, shape) is the skin's call, the position is
 * the kit's.
 */
export function TabsIndicator(props: TabsIndicatorProps) {
  traceLife("ui.tabs-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

// MAP of tabs: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The tabs' passport together with whatever draws each of its five parts. */
export const kit = defineKitComponent(passport, {
  root: Tabs,
  list: TabsList,
  trigger: TabsTrigger,
  content: TabsContent,
  indicator: TabsIndicator,
});
