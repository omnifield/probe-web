// RUNTIME passport of the accordion (`PWEB-37`, `PWEB-115`/`PWEB-118`, decomposed `PWEB-124`) —
// anatomy (`anatomy.ts`) plus everything else the running app needs: per-part STATES,
// the variant axis, and SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata (`means`, group, genus, nesting/`accepts` rules, assembly templates)
// lives in `playground/index.ts` instead; that file depends on this one, never the other way.
//
// ## Why the accordion, and what it gives the mechanism
//
// On the button, half the assembly mechanism sat unproven: one part, no nesting, no ancestor, no
// repeats. Here everything is present at once — two levels of nesting, several nodes sharing one
// coordinate (many items, one address), an ancestor in a state (content looks different when its
// item is expanded), and a spot for composition (an item's trigger is a button).
//
// ## States were taken from a LIVE node, not from documentation
//
// Every state declared below was observed in markup (`accordion.test.tsx`). Two findings are
// worth naming:
//
//   • the TRIGGER's disabledness is expressed by the native `disabled`, not `data-disabled`: Zag
//     puts a real button attribute on the trigger, and puts `data-disabled` on the item, the
//     content, and the indicator instead. That is why the trigger declares the `:disabled`
//     pseudo-class — lying here with a `data-` attribute would hand the skin a dead rule;
//   • the item and the indicator express expansion with ONE vocabulary attribute,
//     `data-state="open"`, exactly as Zag's convention asks, but the CONTENT may not carry that
//     attribute at all when expanded — see below.
//
// ## The pilot's finding: the content's expansion mark does NOT always arrive
//
// Zag's collapsible assembles the item's content, and it drops `data-state` entirely whenever
// expansion happened WITHOUT animation: `skip = !initial && open`
// (`@zag-js/collapsible`, `connect`), and the `initial` flag is only raised by a genuinely
// animated expansion. So an item expanded from the very start carries neither `data-state="open"`
// nor any other expansion mark on its content.
//
// This "not always" is literal: after a real click, the mark arrives one way or another, and that
// was measured, not assumed. A test that expected a specific value from it after a click turned
// red on a repeat run — the unreliability reproduces, but does not reproduce RELIABLY, and cannot
// be asserted in a test (`accordion.test.tsx`). What is checked instead is the declaration, not an
// attempt to catch the mark at the right moment.
//
// **For the LOOK the conclusion stands and is not overturned:** a mark that may be absent cannot
// be an address — a skin rule keyed on it would silently fail to apply on exactly the items
// expanded by default. The expanded LOOK of the content is addressed through the ancestor instead:
// the `item` part holds expansion reliably, and the rule "content inside an expanded item" is
// expressed by the ancestor field that exists in the address for exactly this.
//
// **For MOTION the absence of a mark is the right answer, not a gap** (`PWEB-97`). The
// transition plays exactly when expansion is animated — and the mark arrives at exactly the same
// time; no mark, nothing to play. Had the passport stayed silent about the state entirely, motion
// would have had nothing to address the expanded content with, while the kit places the measured
// size (`--height`) right there too, without which the animation cannot exist. That would leave
// half the mechanism declared and the other half unsaid.
//
// So the state IS DECLARED, and the mark's unreliability is named machine-readably — the
// `absentWhen` field (the form — `@omnifield/probe-web-skin/model`, `PWEB-110`). A reader working
// for the LOOK drops such states itself (`addressesView`, and through it `coordinateOf`); a reader
// working for MOTION reads them together with the circumstance. The passport's former silence
// decided this for both readers at once and was indistinguishable from "the provider did not look".

import {
  defineSettings,
  definePassport,
  type PassportState,
} from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid and no Ark. Needed only so the setting keys are checked
// against the component's real props, not an idea of them.
import type { AccordionProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Expansion — Zag's shared vocabulary attribute; it sits on the item, the content, and the indicator. */
const open = {
  name: "open",
  mark: { kind: "attribute", name: "data-state", value: "open" },
} as const satisfies PassportState;

/** Disabledness, expressed as data: the whole item and everything inside it. */
const disabled = {
  name: "disabled",
  mark: { kind: "attribute", name: "data-disabled" },
} as const satisfies PassportState;

/**
 * The CONTENT's expansion — the same state, with its mark's unreliability named (`PWEB-97`).
 *
 * A separate declaration, not the shared `open`: the item and the indicator carry the mark
 * always, and attaching the caveat to them would lie the other way — the look would stop
 * addressing an expanded item that IS addressed reliably.
 */
const openContent = {
  ...open,
  absentWhen:
    "the item expanded WITHOUT animation: Zag's collapsible drops `data-state` entirely " +
    "(`skip = !initial && open`), and an item expanded from the very start has no mark at all",
} as const satisfies PassportState;

/** Collapsedness — the same vocabulary attribute with a different value. It always arrives on the content. */
const closed = {
  name: "closed",
  mark: { kind: "attribute", name: "data-state", value: "closed" },
} as const satisfies PassportState;

/** Focus within an item: known by the state machine, not the browser — hence an attribute. */
const focus = {
  name: "focus",
  mark: { kind: "attribute", name: "data-focus" },
} as const satisfies PassportState;

/** Passport of the accordion — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      // The root has no states of its own: expansion belongs to the ITEM, not the set, and
      // declaring it here would declare something unobservable — no such attribute appears on
      // the root.
      states: [],
    },
    { name: "item", states: [open, disabled, focus] },
    {
      name: "itemTrigger",
      states: [
        open,
        focus,
        // Not `data-disabled`: Zag puts a REAL `disabled` on the button, and the skin must hook
        // onto that. Checked on a live node.
        { name: "disabled", mark: { kind: "pseudo", name: ":disabled" } },
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        {
          name: "focus-visible",
          mark: { kind: "pseudo", name: ":focus-visible" },
        },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "itemContent",
      // Expansion is declared WITH its caveat: its mark does not always arrive (see the file
      // header). It does not serve the look as an address — a reader working for the look drops
      // it itself, and the expanded look of the content is still addressed through the `item`
      // ancestor. Motion needs it: without it there is nothing to address that exact expansion
      // with, whose size the kit measures and places right here.
      states: [openContent, closed, disabled, focus],
      // The measured size of the expansion (`PWEB-89`). Zag measures the node and places both
      // properties RIGHT HERE — checked on a live node (`accordion.test.tsx`): markup carries
      // `--height: …; --width: …`. Without them the expansion animation does not exist: `auto`
      // does not animate, and a number cannot be invented for someone else's content. The
      // transition over them is written by the SKIN — the kit brings no animation of its own.
      variables: [
        { name: "--height", setBy: "kit" },
        { name: "--width", setBy: "kit" },
      ],
    },
    { name: "itemIndicator", states: [open, disabled, focus] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // WHAT THE ACCORDION CAN BE (`PWEB-89`). All three props pass through and work — until now
  // neither the editor nor the showcase knew this, and showed one flat look.
  //
  // Keys are checked against the component's REAL props: `defineSettings<AccordionProps>` will
  // not allow declaring a setting the accordion does not have, and will not allow forgetting one
  // it does.
  settings: defineSettings<AccordionProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "vertical" }, { value: "horizontal" }],
      },
      byDefault: "vertical",
      // Checked on a live node (`PWEB-104`): the mark arrives as an attribute on EVERY part.
      // `multiple` and `collapsible` have no mark of their own at all — `data-multiple` and
      // `data-collapsible` never appear in markup, which is why they declare no field.
      mark: { kind: "attribute", name: "data-orientation" },
    },
    multiple: {
      values: { kind: "flag" },
      byDefault: false,
    },
    collapsible: {
      values: { kind: "flag" },
      byDefault: false,
      // Dependency on `multiple` (`SKINED-7`). Zag lets the last expanded item be closed if AT
      // LEAST ONE of the two is on — `canToggle = collapsible || multiple`
      // (`@zag-js/accordion`, `accordion.machine.mjs`). With `multiple: true`, closing is already
      // allowed by `multiple` itself, and `collapsible`'s value stops affecting behavior.
      dependsOn: { on: "multiple", redundantWhen: true },
    },
  }),
});
