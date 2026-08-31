import {
  DialogBackdrop as ArkBackdrop,
  DialogCloseTrigger as ArkCloseTrigger,
  DialogContent as ArkContent,
  DialogDescription as ArkDescription,
  DialogPositioner as ArkPositioner,
  DialogRoot as ArkRoot,
  DialogTitle as ArkTitle,
  DialogTrigger as ArkTrigger,
  type DialogBackdropProps as ArkBackdropProps,
  type DialogCloseTriggerProps as ArkCloseTriggerProps,
  type DialogContentProps as ArkContentProps,
  type DialogDescriptionProps as ArkDescriptionProps,
  type DialogPositionerProps as ArkPositionerProps,
  type DialogRootProps as ArkRootProps,
  type DialogTitleProps as ArkTitleProps,
  type DialogTriggerProps as ArkTriggerProps,
} from "@ark-ui/solid/dialog";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Dialog — the kit's modal, from Ark (`ark-ui.com/docs/components/dialog`).
//
// Same device as the rest of the Ark-provided kit: anatomy is Ark's (re-exported straight from
// `@zag-js/dialog`, `../entity/anatomy.ts`), the address is set by Ark itself (spreads
// `parts.*.attrs` inside every `getXxxProps()`, `dialog.connect.mjs`), wrappers are thin,
// `dropAddress` strips any address arriving from OUTSIDE so a node never lies about what it is
// (`PWEB-46`).
//
// `Dialog` (the root) renders no node of its own — pure context, the same situation the popover's
// own root is in (`../entity/anatomy.ts` explains why); `trigger`/`backdrop` are real DOM
// SIBLINGS of `positioner`, not its ancestor or descendant, tied together only by that context.

/** Props of `Dialog` — the root. Renders NO node — pure context, see the file header. */
export type DialogProps = ArkRootProps;

/**
 * The dialog's root — holds the open state. No DOM node of its own.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger>Open</DialogTrigger>
 *   <DialogBackdrop />
 *   <DialogPositioner>
 *     <DialogContent>
 *       <DialogTitle>Title</DialogTitle>
 *       <DialogDescription>Description</DialogDescription>
 *       <DialogCloseTrigger>Close</DialogCloseTrigger>
 *     </DialogContent>
 *   </DialogPositioner>
 * </Dialog>
 * ```
 */
export function Dialog(props: DialogProps) {
  traceLife("ui.dialog");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `DialogTrigger`. */
export type DialogTriggerProps = ArkTriggerProps;

/** Opens the dialog — a real `<button>`; `value` names WHICH dialog, in a multi-trigger composition. */
export function DialogTrigger(props: DialogTriggerProps) {
  traceLife("ui.dialog-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}

/** Props of `DialogBackdrop`. */
export type DialogBackdropProps = ArkBackdropProps;

/** The dimmed overlay behind the dialog — ONE node, no graphic of its own. */
export function DialogBackdrop(props: DialogBackdropProps) {
  traceLife("ui.dialog-backdrop");

  return <ArkBackdrop {...dropAddress(props)} />;
}

/** Props of `DialogPositioner`. */
export type DialogPositionerProps = ArkPositionerProps;

/** Centers `content` in the viewport — ONE node; unlike the popover's, no floating-UI placement. */
export function DialogPositioner(props: DialogPositionerProps) {
  traceLife("ui.dialog-positioner");

  return <ArkPositioner {...dropAddress(props)} />;
}

/** Props of `DialogContent`. */
export type DialogContentProps = ArkContentProps;

/** The dialog's own panel — ONE node, focusable only by script (`tabIndex={-1}`). */
export function DialogContent(props: DialogContentProps) {
  traceLife("ui.dialog-content");

  return <ArkContent {...dropAddress(props)} />;
}

/** Props of `DialogTitle`. */
export type DialogTitleProps = ArkTitleProps;

/** The dialog's own title — ONE node, wired to `content` via `aria-labelledby`. */
export function DialogTitle(props: DialogTitleProps) {
  traceLife("ui.dialog-title");

  return <ArkTitle {...dropAddress(props)} />;
}

/** Props of `DialogDescription`. */
export type DialogDescriptionProps = ArkDescriptionProps;

/** The dialog's own description — ONE node, wired to `content` via `aria-describedby`. */
export function DialogDescription(props: DialogDescriptionProps) {
  traceLife("ui.dialog-description");

  return <ArkDescription {...dropAddress(props)} />;
}

/** Props of `DialogCloseTrigger`. */
export type DialogCloseTriggerProps = ArkCloseTriggerProps;

/** Closes the dialog — a real `<button>`, no graphic of its own. */
export function DialogCloseTrigger(props: DialogCloseTriggerProps) {
  traceLife("ui.dialog-close-trigger");

  return <ArkCloseTrigger {...dropAddress(props)} />;
}

// MAP of the dialog: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/**
 * The dialog's passport together with whatever draws each of its seven parts.
 *
 * `root` is not a key here — the passport's `root` names `positioner` (`../entity/passport.ts`),
 * and `Dialog` itself renders no node to map: it is context only, drawn by nothing.
 */
export const kit = defineKitComponent(passport, {
  trigger: DialogTrigger,
  backdrop: DialogBackdrop,
  positioner: DialogPositioner,
  content: DialogContent,
  title: DialogTitle,
  description: DialogDescription,
  closeTrigger: DialogCloseTrigger,
});
