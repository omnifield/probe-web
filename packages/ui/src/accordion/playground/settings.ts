// EDITOR-ONLY setting prose for the accordion — read by `./index.ts`'s `defineEditorInfo` call.
// Three names from the closed `SETTINGS` vocabulary intersect the accordion's own props
// (`../entity/passport.ts`): `orientation`, `multiple`, `collapsible`. The listbox's, select's,
// carousel's and tabs' own `playground/settings.ts` all name this file as the shape they follow.
//
// NO TYPE ANNOTATION, and that is the point (`PWEB-209`). Bare inference keeps the literal keys
// — object literal KEYS do not widen — so `ValuesOf` really checks `options` against the
// setting's own values: rename `vertical` here and `tsc` names exactly that, at the
// `defineEditorInfo` call ("Property 'vertical' is missing … required in
// `Record<"horizontal" | "vertical", …>`"). Measured, 2026-08-31.
//
// What stood here before — `Readonly<Record<string, PassportSettingEditorInfo>>` — loses that.
// The widened record is no longer assignable to the per-setting keys `PassportEditorSpec` asks
// for, so the same rename stops producing its own error and produces a MISLEADING one instead:
// "missing the following properties: collapsible, multiple, orientation" — all three of which are
// written right below. Also measured on the same rename.
//
// No `as const` either, unlike `parts.ts` next door: that file needs one because it carries
// literal property VALUES (`kind: "component"`), which DO widen on their own. Nothing here is a
// literal value — only prose and keys — so `as const` would buy nothing.
//
// The trade-off is the same one `parts.ts` names: `tsc` no longer says "you named every real
// setting, and only real ones". `defineEditorInfo` catches a MISSING setting at runtime, and
// checks a choice setting's options both ways; an extra name that no passport declares is the
// one thing NEITHER side rejects — `tsc` because this is a named const, not a fresh literal at
// the call (no excess-property check), and the runtime because it only looks for missing ones.
// Measured both ways, 2026-08-31.

export const settings = {
  orientation: {
    means:
      "how items are laid out: top to bottom or left to right — this drives keyboard navigation and aria",
    options: {
      vertical: { means: "top to bottom" },
      horizontal: { means: "left to right" },
    },
  },
  multiple: { means: "whether several items can stay expanded at once" },
  collapsible: {
    means:
      "whether the last expanded item can be closed, leaving the whole accordion collapsed",
  },
};
