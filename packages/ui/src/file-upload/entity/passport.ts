// RUNTIME passport of the file upload — anatomy (`anatomy.ts`) plus everything else the running
// app needs: per-part STATES and the variant axis, tied together by `definePassport`.
//
// THIS FILE IS RUNTIME ONLY, same as the anatomy it builds on — it ships in the app bundle.
// Editor-facing metadata lives in `playground/index.ts` instead; that file depends on this one,
// never the other way.
//
// Every mark below was read from `@zag-js/file-upload/file-upload.connect.mjs` (323 lines, read
// in full), the same rigor the rest of the kit's passports read from a `.connect.mjs`.
//
// ## `accepted`/`rejected` reach SIX parts — which LIST an item belongs to, not a per-item look
//
// `getItemGroupProps`/`getItemProps`/`getItemNameProps`/`getItemSizeTextProps`/
// `getItemPreviewProps`/`getItemPreviewImageProps`/`getItemDeleteTriggerProps` ALL take a
// `type` param (`"accepted"` by default, or `"rejected"`) and spread it as `data-type` — checked
// on all seven, `itemPreviewImage` included even though it is the one part that can only ever
// render for an ACCEPTED, image-typed file (`getItemPreviewImageProps` throws for non-images —
// rejected files can still be image-typed and rejected for an unrelated reason, e.g. size, so the
// mark is genuinely two-valued there too, not always `"accepted"`). Declared as a shared pair,
// the same device the date picker's own `view`/the drawer's own `swipeDirection` already use for
// one attribute with more than two meaningful values.
//
// ## `clearTrigger`'s native `hidden` has NOTHING else to point to — an honest absence, not a
// redundancy exclusion
//
// Every other kit component's excluded native `hidden` (the checkbox's own indicator, the
// popover's own content) pointed at an ALREADY-DECLARED state carrying the identical fact.
// `clearTrigger` hides itself when `acceptedFiles.length === 0` — but nothing else in this
// connector ever marks "the file list is empty" as a `data-*` attribute anywhere (unlike the date
// picker's own `data-empty`/`data-placeholder-shown`). There is no substitute address to name
// here: the browser's own `hidden` already does the only work there is to do, and no CSS rule
// could act on it any differently than `hidden` itself already ensures.
//
// ## `trigger`/`itemDeleteTrigger`/`clearTrigger` — native `disabled` differs from `data-disabled` on purpose
//
// All three set native `disabled={disabled || readOnly}` (BOTH conditions) but `data-disabled`
// alone (`disabled` only — `readOnly` gets its OWN separate `data-readonly` mark). The explicitly
// emitted marks are declared, the tabs' own trigger's own rule; native `disabled` being a
// slightly WIDER condition than its `data-disabled` twin is named here, not silently narrowed to
// match.

import { defineSettings, definePassport, type PassportState } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: `import type` is erased at build time entirely, and the `./passport` subpath stays
// what it is sold as — data with no Solid. Needed only so the setting keys are checked against
// the component's real props.
import type { FileUploadProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

/** The whole widget is disabled — reaches every part. */
const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;
/** The value is visible, changing it is not possible. */
const readOnly = { name: "readonly", mark: { kind: "attribute", name: "data-readonly" } } as const satisfies PassportState;

/** This item landed in the accepted list. Shared by six item-related parts. */
const accepted = { name: "accepted", mark: { kind: "attribute", name: "data-type", value: "accepted" } } as const satisfies PassportState;
/** This item was rejected (size, type, or count) — the same attribute, the other value. */
const rejected = { name: "rejected", mark: { kind: "attribute", name: "data-type", value: "rejected" } } as const satisfies PassportState;
const itemTypeStates: readonly PassportState[] = [accepted, rejected];

/** A genuine button with no JS-tracked pointer state — the plain button's own reasoning. */
const buttonPseudos: readonly PassportState[] = [
  { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
  { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
  { name: "active", mark: { kind: "pseudo", name: ":active" } },
];

/** Passport of the file upload — anatomy plus what anatomy alone does not say. */
export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [disabled, readOnly, { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } }],
    },
    {
      name: "dropzone",
      states: [
        disabled,
        readOnly,
        { name: "dragging", mark: { kind: "attribute", name: "data-dragging" } },
        { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } },
      ],
    },
    { name: "label", states: [disabled, { name: "required", mark: { kind: "attribute", name: "data-required" } }] },
    {
      name: "trigger",
      states: [disabled, readOnly, { name: "invalid", mark: { kind: "attribute", name: "data-invalid" } }, ...buttonPseudos],
    },
    // Hidden while no file is accepted (native `hidden`, `acceptedFiles.length === 0`) — no
    // substitute address exists to name here; see the file header.
    { name: "clearTrigger", states: [disabled, readOnly, ...buttonPseudos] },
    { name: "itemGroup", states: [disabled, ...itemTypeStates] },
    { name: "item", states: [disabled, ...itemTypeStates] },
    { name: "itemName", states: [disabled, ...itemTypeStates] },
    { name: "itemSizeText", states: [disabled, ...itemTypeStates] },
    { name: "itemPreview", states: [disabled, ...itemTypeStates] },
    { name: "itemPreviewImage", states: [disabled, ...itemTypeStates] },
    { name: "itemDeleteTrigger", states: [disabled, readOnly, ...itemTypeStates, ...buttonPseudos] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // NO settings from the closed vocabulary apply: `directory`/`maxFiles`/`accept`/`capture` are
  // real props, but none is `orientation`/`multiple`/`collapsible` — the same empty result the
  // dialog's own settings already show.
  settings: defineSettings<FileUploadProps>()({}),
});
