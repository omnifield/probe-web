import {
  createToaster as arkCreateToaster,
  Toaster as ArkToaster,
  ToastActionTrigger as ArkActionTrigger,
  ToastCloseTrigger as ArkCloseTrigger,
  ToastDescription as ArkDescription,
  ToastRoot as ArkRoot,
  ToastTitle as ArkTitle,
  type CreateToasterProps as ArkCreateToasterProps,
  type CreateToasterReturn as ArkCreateToasterReturn,
  type ToastActionTriggerProps as ArkActionTriggerProps,
  type ToastCloseTriggerProps as ArkCloseTriggerProps,
  type ToastDescriptionProps as ArkDescriptionProps,
  type ToasterProps as ArkToasterProps,
  type ToastRootProps as ArkRootProps,
  type ToastTitleProps as ArkTitleProps,
} from "@ark-ui/solid/toast";
import type { JSX } from "solid-js";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Toast — the kit's only component backed by TWO zag machines at once (`../entity/anatomy.ts`
// explains the split): a singleton STORE holding every live toast (`group`), and one machine PER
// toast (`root`). Same device as the rest of the Ark-provided kit regardless: anatomy is Ark's
// (re-exported straight from `@zag-js/toast`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `toast.connect.mjs`/`toast-group.connect.mjs`),
// wrappers are thin, `dropAddress` strips any address arriving from OUTSIDE so a node never lies
// about what it is (`PWEB-46`).
//
// Names follow ARK'S OWN here, not the kit's usual bare-`ComponentName`-for-root convention:
// `createToaster` builds the store (call it once, module scope — it is not a per-render prop),
// `Toaster` draws `group` and iterates the store's live toasts, `ToastRoot`/`ToastTitle`/… draw
// one toast's own parts, composed INSIDE `Toaster`'s own render prop, not at the top level the
// way every other component's `root` is. Renaming any of this away from Ark's own vocabulary
// would only cost a reader who already knows Ark's docs, for no gain.

/** Props of `createToaster`. */
export type CreateToasterProps = ArkCreateToasterProps;
/** What `createToaster` returns — a live store, passed to `Toaster`'s own `toaster` prop. */
export type CreateToasterReturn<T = JSX.Element> = ArkCreateToasterReturn<T>;

/**
 * Builds the toast STORE — call this ONCE (module scope, not inside a component body) and pass
 * the result to `Toaster`'s own `toaster` prop; every `toast.create(...)`/`toast.success(...)`
 * call against it queues a new toast the group renders.
 */
export const createToaster = arkCreateToaster;

/** Props of `Toaster` — draws `group`. */
export type ToasterProps = ArkToasterProps;

/**
 * The toast region — draws `group`, iterates the store's live toasts, and mounts one `root`
 * machine per toast; `children` is a render prop, one call per live toast.
 *
 * @example
 * ```tsx
 * const toaster = createToaster({ placement: "bottom-end" });
 *
 * <Toaster toaster={toaster}>
 *   {(toast) => (
 *     <ToastRoot>
 *       <ToastTitle>{toast().title}</ToastTitle>
 *       <ToastDescription>{toast().description}</ToastDescription>
 *       <ToastActionTrigger>Undo</ToastActionTrigger>
 *       <ToastCloseTrigger>✕</ToastCloseTrigger>
 *     </ToastRoot>
 *   )}
 * </Toaster>
 * ```
 */
export function Toaster(props: ToasterProps) {
  traceLife("ui.toaster");

  return <ArkToaster {...dropAddress(props)} />;
}

/** Props of `ToastRoot`. */
export type ToastRootProps = ArkRootProps;

/**
 * One toast's own wrapper — ONE node, real per-toast machine; two unaddressed "ghost" nodes
 * (`../entity/anatomy.ts`) come along automatically, not something a consumer arranges.
 */
export function ToastRoot(props: ToastRootProps) {
  traceLife("ui.toast-root");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `ToastTitle`. */
export type ToastTitleProps = ArkTitleProps;

/** This toast's own title — ONE node, wired to `root` via `aria-labelledby`. */
export function ToastTitle(props: ToastTitleProps) {
  traceLife("ui.toast-title");

  return <ArkTitle {...dropAddress(props)} />;
}

/** Props of `ToastDescription`. */
export type ToastDescriptionProps = ArkDescriptionProps;

/** This toast's own description — ONE node, wired to `root` via `aria-describedby`. */
export function ToastDescription(props: ToastDescriptionProps) {
  traceLife("ui.toast-description");

  return <ArkDescription {...dropAddress(props)} />;
}

/** Props of `ToastActionTrigger`. */
export type ToastActionTriggerProps = ArkActionTriggerProps;

/** This toast's own optional action (e.g. "Undo") — a real `<button>`; clicking it also dismisses the toast. */
export function ToastActionTrigger(props: ToastActionTriggerProps) {
  traceLife("ui.toast-action-trigger");

  return <ArkActionTrigger {...dropAddress(props)} />;
}

/** Props of `ToastCloseTrigger`. */
export type ToastCloseTriggerProps = ArkCloseTriggerProps;

/** Dismisses this toast — a real `<button>`, no graphic of its own. */
export function ToastCloseTrigger(props: ToastCloseTriggerProps) {
  traceLife("ui.toast-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}

// MAP of the toast: passport part → the component that draws it (`PWEB-84`).
//
// `root` maps to `ToastRoot` (one toast's own wrapper), NOT to `Toaster` — `Toaster` draws
// `group` (`../entity/anatomy.ts` explains the two-machine split); `createToaster` is a factory
// function, not a component, and has no entry here.

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The toast's passport together with whatever draws each of its six parts. */
export const kit = defineKitComponent(passport, {
  group: Toaster,
  root: ToastRoot,
  title: ToastTitle,
  description: ToastDescription,
  actionTrigger: ToastActionTrigger,
  closeTrigger: ToastCloseTrigger,
});
