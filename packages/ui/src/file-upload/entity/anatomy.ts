// RUNTIME anatomy of the file upload (`ark-ui.com/docs/components/file-upload`) — a dropzone plus
// a list of picked files.
//
// THIS FILE HOLDS PARTS AND ADDRESSES ONLY — nothing else, the same split as every other
// component's `entity/anatomy.ts`. The fuller runtime contract — per-part STATES, the variant
// axis, SETTINGS — lives one level up, in `passport.ts`. Editor-facing metadata is a further step
// removed, in `playground/index.ts`.
//
// The anatomy is NOT declared here: it arrives ready-made, the same reason and the same subpath
// discipline as every Zag-backed component in the kit. It physically lives in
// `@zag-js/file-upload/anatomy`; Ark's own `fileUploadAnatomy` is the SAME object, re-exported
// straight from `@zag-js/file-upload` — checked in the installed chunk
// (`src/components/file-upload/file-upload.anatomy.ts` does nothing but
// `export { anatomy } from "@zag-js/file-upload"`), no `.extendWith(...)`.
//
// TWELVE parts: `root · dropzone · label · trigger · clearTrigger · itemGroup · item ·
// itemName · itemSizeText · itemPreview · itemPreviewImage · itemDeleteTrigger`. A thirteenth
// node, the real `<input type="file">` (`hiddenInput`), exists in the DOM for the native file
// picker and form participation, but carries no anatomy address — the same finding the
// checkbox's own hidden input already logged.

import { anatomy as fileUploadAnatomy } from "@zag-js/file-upload/anatomy";

/** Parts and addresses — taken, not ours. Twelve, and the map below covers them all. */
export const anatomy = fileUploadAnatomy;

/** Part addresses: `attrs` for the node, `selector` for styling. Computed once — they are static. */
export const anatomyParts = anatomy.build();
