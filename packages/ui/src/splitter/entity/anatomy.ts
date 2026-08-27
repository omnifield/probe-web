// RUNTIME anatomy of the splitter (`ark-ui.com/docs/components/splitter`).
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/splitter/anatomy`; Ark's own `splitterAnatomy` is the SAME object, re-exported through
// its own chunk, no `.extendWith(...)`.
//
// FOUR parts: `root · panel · resizeTrigger · resizeTriggerIndicator`. `panel` is REQUIRED to
// carry its own `id` prop (`SplitterPanelProps` extends the machine's `PanelProps`, `id: PanelId`)
// — the machine indexes panels by that id (`prop("panels")` is `PanelData[]`, matched by id, not
// by DOM order alone). `resizeTrigger`'s own `id` is the COMPOSITE `"${beforeId}:${afterId}"` —
// one resize trigger sits between exactly two panels; `resolveResizeTriggerId`
// (`splitter.connect.mjs`) also accepts a single bare id and resolves the neighbour itself, but
// the composite form is what the connector actually reads off `props.id` when both halves are
// already known.

import { anatomy as splitterAnatomy } from "@zag-js/splitter/anatomy";

/** Parts and addresses — taken, not ours. Four, and the map below covers them all. */
export const anatomy = splitterAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
