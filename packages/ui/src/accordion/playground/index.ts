// EDITOR-ONLY metadata for the accordion (`PWEB-115`, `PWEB-118`, decomposed `PWEB-124`).
//
// Human-facing text, taxonomy, and nesting rules for the visual editor and for agents reading the
// catalog — never for the running app. The same split every mature UI kit and design-system tool
// makes, just under different names (Storybook's `argTypes`/docs vs. component code, Zag/Ark's
// own `anatomy.ts`): `defineEditorInfo` depends one-way on `passport` (the runtime contract in
// `../entity/passport.ts`, built on the bare parts in `../entity/anatomy.ts`), and nothing flows
// back, so a production bundle that never imports `/editor` never pays for a single word written
// below.
//
// Nesting is declared TWO levels deep: the item inside the root, the trigger and the content
// inside the item. This is the first place where the nesting rule is checkable at all — the
// button has no internal parts, and there was nothing to derive "who can be an ancestor" from.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { dataPresets } from "./data.js";
import { settings } from "./settings.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  // The provider is US, not Ark: the component ships outward as our own delivery, and a passport
  // reader records exactly that. A test guards the match against the manifest.
  package: "@omnifield/probe-web-ui",
  genus: "component",
  // Place in the catalog (`PWEB-34`): something that expands and collapses.
  group: "disclosure",
  // Крупнее кнопки — обычно несёт заголовок и раскрытый текст, — но не претендует на строку
  // целиком: несколько пунктов рядом читаются нормально (`footprintOf`, `PWEB-31`).
  footprint: "regular",
  variantAxis: {
    means:
      "the variant name a human gives the accordion in the editor; the kit passes it through untouched",
  },
  parts,
  settings,
  assemblies,
  dataPresets,
});
