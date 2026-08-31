// EDITOR-ONLY metadata for the button (`PWEB-115`, `PWEB-118`, decomposed `PWEB-124`, split out
// `PWEB-127`).
//
// Human-facing text, taxonomy, and templates for the visual editor and for agents that read the
// catalog — never for the running app. This is the same split every mature UI kit and design-
// system tool makes, just under different names:
//
//  • Storybook keeps `argTypes`/docs/control metadata in `*.stories.tsx`, separate from the
//    component it describes — the component never imports its own story file.
//  • Zag.js/Ark UI keep `anatomy.ts` (parts only) separate from framework connectors; neither
//    carries prose meant for a human reading a docs site.
//
// `defineEditorInfo` depends on `passport` (the runtime contract in `../entity/passport.ts`, built
// on the bare parts in `../entity/anatomy.ts`) so the two stay addressed by the same part/state
// names — but nothing here flows the other way: the runtime files have no import from this one,
// so a production bundle that never reaches into `/editor` never pays for a single word written
// below.
//
// THIN on purpose: taxonomy (`parts.ts`) and scenario data (`assemblies.ts`) live in their own
// files, the SAME physical shape as every other component's `playground/` — one part and three
// assemblies still get the full template, not a size-driven exception. Data PRESETS (`data.ts`,
// literal `DataPreset[]` with human-facing prose) are GONE (PWEB-180 continuation, 2026-08-29,
// postановка user): a component no longer carries a pile of example text — it carries `io`
// (`../entity/io.ts`, the RUNTIME input/output shape, not editor-only), and filling the showcase
// with content from that shape is the skin editor's job, a mechanic not yet built.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  // The provider is named as data: the form is shared across every provider, and a passport
  // reader does not know package names ahead of time. A test guards the match against the
  // manifest — otherwise this string would drift from it silently.
  package: "@omnifield/probe-web-ui",
  // A button is a plain component, not an icon: things go inside it, it does not go inside a
  // single glyph. The genus is declared here because otherwise a candidate could only be
  // recognized by package name (`PWEB-24`).
  genus: "component",
  // Just a place in the catalog (`PWEB-34`): a button is something you press, not something you
  // enter a value with. The provider names the section, because otherwise every editor host
  // would invent its own name for it.
  group: "actions",
  // The smallest action atom in the kit — shouldn't take up as much room in the case gallery as
  // a large composite component (`footprintOf`, `PWEB-31`).
  footprint: "compact",
  variantAxis: {
    means: "the variant name a human gives the button in the editor; the kit passes it through untouched",
  },
  parts,
  assemblies,
});
