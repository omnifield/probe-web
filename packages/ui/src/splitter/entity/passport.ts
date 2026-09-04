// RUNTIME passport of the splitter — anatomy (`anatomy.ts`) plus everything else the running app
// needs: per-part STATES, the variant axis, SETTINGS, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/splitter/splitter.connect.mjs` (307 lines) AND
// `splitter.machine.mjs` (654 lines, both read in full — `machine.mjs` is needed here because
// `dragging`'s TWO SCOPES, below, can only be told apart by reading which state each one reads
// off, not from `connect.mjs` alone).
//
// ## `data-dragging` means TWO DIFFERENT THINGS depending on which part carries it — a real,
// unreconciled inconsistency inside this one connector
//
// `getRootProps`/`getPanelProps` both write `dataAttr(state.matches("dragging"))` — the machine's
// OWN top-level state, true the instant ANY resize trigger anywhere in this splitter starts
// dragging, false the instant it ends. `getResizeTriggerState` (feeding both
// `getResizeTriggerProps` and `getResizeTriggerIndicator`) instead computes
// `context.get("dragState")?.resizeTriggerId === id` — true ONLY for the ONE trigger actually
// being dragged, false for every other trigger in the same splitter while dragging is under way
// elsewhere. Declared as two SEPARATELY NAMED states below (`dragging` on `root`/`panel`,
// `dragging` on `resizeTrigger`/`resizeTriggerIndicator` — same mark, same attribute name, but two
// distinct `PassportState` entries, one per scope) rather than pretended to be one fact: a skin
// keying a rule off `panel[data-dragging]` gets "something in this splitter is resizing", not
// "this panel's own neighbour handle is resizing" — genuinely different questions, both real.
//
// ## `panel`'s `data-id`/`data-index`/`data-ownedby` are identity/positional data, not a look —
// excluded, the same category as `data-value`/`data-path` everywhere else in the kit
//
// `getPanelProps` also writes these three, unconditionally. None varies with anything a skin
// would style differently — they exist so the machine (and `getPanelById`) can find the node
// again, the tree view's own `data-depth` exclusion reasoning applies unchanged.
//
// ## `resizeTrigger`'s real hover is tracked in the MACHINE (`hover:temp`/`hover` states, a
// 250ms debounce, `splitter.machine.mjs`) but NEVER reaches the DOM as any mark — genuinely
// invisible to `connect.mjs`, not an oversight here
//
// Neither `getResizeTriggerProps` nor `getResizeTriggerIndicator` reads `state.matches("hover")`
// anywhere — checked against the full 307-line connector. The only DOM-visible trace of pointer
// presence is the real `onPointerDown`/`onPointerUp`/`onPointerOver`/`onPointerLeave` handlers and
// the `cursor: "col-resize"/"row-resize"` style, i.e. genuine, JS-tracked pointer affordance with
// no attribute to key off — declared as `:hover`, the honest pseudo, the same device the date
// picker's/drawer's own untracked surfaces use, but for the opposite reason (there, no JS tracking
// at all; here, JS tracks it and simply never writes it out).
//
// ## `resizeTrigger`'s `data-focus` conflates "really keyboard-focused" with "currently being
// dragged" — by the connector's own design, not a slip
//
// `getResizeTriggerState`: `focused = dragging || (state.matches("focused") && keyboardState?.id
// === id)`. A trigger mid-drag reports BOTH `data-focus` and `data-dragging` true at once — real
// `tabIndex`/`onFocus`/`onBlur` roving focus exists too (`onKeyDown` handles arrows/Home/End/
// Enter/F6), but no separate `:focus-visible` is declared alongside the explicit `data-focus`, the
// tabs' trigger's own rule (the mark that is explicitly emitted is the one declared) — unchanged
// here even though the value it carries is compound.

import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { SplitterProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** Group-wide: true while ANY resize trigger in this splitter is being dragged. */
const groupDragging = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } } as const satisfies PassportState;

/** Per-trigger: true only for the ONE trigger actually being dragged — same attribute, narrower scope. */
const ownDragging = { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } } as const satisfies PassportState;

/** Real keyboard/roving focus — also true while dragging (see file header). */
const focus = { name: "focus", mark: { kind: "attribute", name: "data-focus" } } as const satisfies PassportState;

/** This trigger cannot be dragged or focused. */
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;

/** Real, JS-tracked pointer presence that never reaches the DOM as a mark — see the file header. */
const hoverPseudo = { name: "hover", mark: { kind: "pseudo", name: ":hover" } } as const satisfies PassportState;

/** Passport of the splitter — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [groupDragging] },
    { name: "panel", states: [groupDragging] },
    { name: "resizeTrigger", states: [ownDragging, focus, disabled, hoverPseudo] },
    { name: "resizeTriggerIndicator", states: [ownDragging, focus, disabled, hoverPseudo] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ONE setting from the closed vocabulary applies: `orientation` (`PWEB-89`) — same name, same
  // shape, same mark as the carousel's/accordion's/tabs' own. `panels`/`size`/`defaultSize`/
  // `keyboardResizeBy`/`registry`/`onResize*`/`onCollapse`/`onExpand` are all real props, but none
  // of them is in the closed vocabulary — `defineSettings`'s own `Extract<keyof Props,
  // PassportSettingName>` filters them out by construction.
  settings: defineSettings<SplitterProps>()({
    orientation: {
      values: {
        kind: "choice",
        options: [{ value: "horizontal" }, { value: "vertical" }],
      },
      byDefault: "horizontal",
      mark: { kind: "attribute", name: "data-orientation" },
    },
  }),
});
