import {
  TimerActionTrigger as ArkActionTrigger,
  TimerArea as ArkArea,
  TimerControl as ArkControl,
  TimerItem as ArkItem,
  TimerRoot as ArkRoot,
  TimerSeparator as ArkSeparator,
  useTimerContext,
  type TimerActionTriggerProps as ArkActionTriggerProps,
  type TimerAreaProps as ArkAreaProps,
  type TimerControlProps as ArkControlProps,
  type TimerItemProps as ArkItemProps,
  type TimerRootProps as ArkRootProps,
  type TimerSeparatorProps as ArkSeparatorProps,
} from "@ark-ui/solid/timer";
import { splitProps } from "solid-js";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Timer — a start/pause/reset stopwatch or countdown, from Ark
// (`ark-ui.com/docs/components/timer`).
//
// Same device as the rest of the Ark-provided kit for six of its eight parts: anatomy is Ark's
// (re-exported straight from `@zag-js/timer`, `../entity/anatomy.ts`), the address is set by Ark
// itself (spreads `parts.*.attrs` inside every `getXxxProps()`, `timer.connect.mjs`), wrappers
// are thin, `dropAddress` strips any address arriving from OUTSIDE so a node never lies about
// what it is (`PWEB-46`).
//
// `TimerItemLabel`/`TimerItemValue` are the exception: `@ark-ui/solid` ships no Solid component
// for either (`../entity/anatomy.ts` explains why) even though the zag connector they need
// (`getItemLabelProps`/`getItemValueProps`) is real and working. Hand-authored here off the SAME
// public `useTimerContext()` hook every other Ark component in this file uses internally — same
// mechanism, same reactivity, just without an `ark.div`/`mergeProps` wrapper Ark itself did not
// export for this pair (a plain `<div>` plus `dropAddress` does the identical job for a part with
// no event handlers of its own to compose, which neither of these two ever has).

/** Props of `Timer` — the root. */
export type TimerProps = ArkRootProps;

/**
 * The timer's root — holds start/pause/reset and the interval.
 *
 * @example
 * ```tsx
 * <Timer countdown startMs={60_000}>
 *   <TimerArea>
 *     <TimerItem type="minutes" />
 *     <TimerSeparator>:</TimerSeparator>
 *     <TimerItem type="seconds" />
 *   </TimerArea>
 *   <TimerControl>
 *     <TimerActionTrigger action="start">Start</TimerActionTrigger>
 *     <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
 *     <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
 *     <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
 *   </TimerControl>
 * </Timer>
 * ```
 */
export function Timer(props: TimerProps) {
  traceLife("ui.timer");

  return <ArkRoot {...dropAddress(props)} />;
}

/** Props of `TimerArea`. */
export type TimerAreaProps = ArkAreaProps;

/** Wraps the time-unit display — ONE node, `role="timer"`, announces changes to assistive tech. */
export function TimerArea(props: TimerAreaProps) {
  traceLife("ui.timer-area");

  return <ArkArea {...dropAddress(props)} />;
}

/** Props of `TimerItem`. */
export type TimerItemProps = ArkItemProps;

/** One time unit (`type` is required, e.g. `"minutes"`) — renders its own formatted value as text; carries `--value`, the raw number. */
export function TimerItem(props: TimerItemProps) {
  traceLife("ui.timer-item");

  return <ArkItem {...dropAddress(props)} />;
}

/** Props of `TimerItemLabel` — same shape as `TimerItem`'s own (`type` names the same time unit). */
export type TimerItemLabelProps = ArkItemProps;

/**
 * One time unit's own label (e.g. "min") — content is the consumer's, unlike `TimerItem` which
 * fills itself in. Hand-authored — see the file header.
 */
export function TimerItemLabel(props: TimerItemLabelProps) {
  traceLife("ui.timer-item-label");

  const [local, rest] = splitProps(props, ["type"]);
  const timer = useTimerContext();

  return <div {...dropAddress(rest)} {...timer().getItemLabelProps({ type: local.type })} />;
}

/** Props of `TimerItemValue` — same shape as `TimerItem`'s own. */
export type TimerItemValueProps = ArkItemProps;

/**
 * One time unit's own numeric value, decomposed from `TimerItem`'s all-in-one text — content is
 * the consumer's. Hand-authored — see the file header.
 */
export function TimerItemValue(props: TimerItemValueProps) {
  traceLife("ui.timer-item-value");

  const [local, rest] = splitProps(props, ["type"]);
  const timer = useTimerContext();

  return <div {...dropAddress(rest)} {...timer().getItemValueProps({ type: local.type })} />;
}

/** Props of `TimerSeparator`. */
export type TimerSeparatorProps = ArkSeparatorProps;

/** Between two time units (e.g. the `:` in `05:30`) — ONE node per gap, `aria-hidden`. */
export function TimerSeparator(props: TimerSeparatorProps) {
  traceLife("ui.timer-separator");

  return <ArkSeparator {...dropAddress(props)} />;
}

/** Props of `TimerControl`. */
export type TimerControlProps = ArkControlProps;

/** Wraps the action buttons — ONE node. */
export function TimerControl(props: TimerControlProps) {
  traceLife("ui.timer-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Props of `TimerActionTrigger`. */
export type TimerActionTriggerProps = ArkActionTriggerProps;

/**
 * One action button — `action` is required (`"start"|"pause"|"resume"|"reset"|"restart"`); the
 * kit hides whichever actions do not apply to the current state (native `hidden`, no substitute
 * address — `../entity/passport.ts` explains why).
 */
export function TimerActionTrigger(props: TimerActionTriggerProps) {
  traceLife("ui.timer-action-trigger");

  return <ArkActionTrigger {...dropAddress(props)} />;
}

// MAP of the timer: passport part → the component that draws it (`PWEB-84`).
//
// `itemLabel`/`itemValue` map to HAND-AUTHORED components, not Ark-provided ones — `@ark-ui/solid`
// ships no Solid wrapper for either (`../entity/anatomy.ts` explains the gap).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/** The timer's passport together with whatever draws each of its eight parts. */
export const kit = defineKitComponent(passport, {
  root: Timer,
  area: TimerArea,
  control: TimerControl,
  item: TimerItem,
  itemLabel: TimerItemLabel,
  itemValue: TimerItemValue,
  actionTrigger: TimerActionTrigger,
  separator: TimerSeparator,
});
