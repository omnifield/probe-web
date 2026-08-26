// EDITOR-ONLY metadata for the button (`PWEB-115`, `PWEB-118`, decomposed `PWEB-124`).
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
// `defineEditorInfo` depends on `passport` (the runtime contract in `button.anatomy.ts`) so the
// two stay addressed by the same part/state names — but nothing here flows the other way: the
// runtime file has no import from this one, so a production bundle that never reaches into
// `/editor` never pays for a single word written below.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "./button.anatomy.js";

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
  variantAxis: {
    means: "the variant name a human gives the button in the editor; the kit passes it through untouched",
  },
  parts: {
    root: {
      means: 'the whole button — a single node, a native `<button type="button">` by default',
      states: {
        hover: { means: "pointer is over the button" },
        "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
        active: { means: "the button is being held down" },
        disabled: { means: "cannot be pressed; the button does not call its handler" },
        busy: { means: "work is in progress — the consumer sets this attribute together with `disabled`" },
        expanded: { means: "the button has expanded what it controls — the attribute arrives from an outer component" },
        pressed: { means: "a toggle button is pressed — pressedness belongs to the outer component, the look belongs to the button" },
      },
      // Inside the button — a label and an icon, and nothing else (`PWEB-24`).
      //
      // There is no `parts` list here: the button has one part, there is nothing to nest inside
      // itself. Content is named by GENUS, not by component names — an icon arrives from a
      // different package, and a list of names here would fall behind on the very next icon.
      //
      // Layout is deliberately not accepted inside a button: a button is an endpoint you press,
      // not a place for a tree. Allowing "any component" would make the nesting rule reject
      // nothing at all, leaving it the same "yes or no" it already was.
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
  },
  // SEVERAL ASSEMBLY TEMPLATES (`PWEB-116`). A button is a simpler subject than an accordion — one
  // node, no nesting, no state-in-assembly — and padding the list for a round number is pointless:
  // the honest count here is three, exactly what a button can be by content composition
  // (`root.accepts`: text, icon, or both) — no more, no less.
  //
  // No assembly needs a prop to work — the same provider knowledge as before, just empty, and it
  // does not change from one assembly to the next.
  assemblies: [
    {
      name: "label",
      means: "a button with a label",
      tree: { part: "root", children: [{ genus: "text", value: "Button" }] },
    },
    {
      name: "icon-label",
      means: "a button with an icon and a label",
      // The icon LEADS the label — content order is the view author's call (see the accordion
      // passport for the same argument). The icon here is a placeholder (`★`), not a real
      // `lucide-solid` component: the assembly's base is data, not code (`icon.anatomy.ts`).
      tree: {
        part: "root",
        children: [
          { genus: "icon", value: "★" },
          { genus: "text", value: "Button with icon" },
        ],
      },
    },
    {
      name: "icon-only",
      means: "a button with a single icon, no label",
      // A third honest case, not a repeat of the second minus text: an icon-only button is its
      // own real shape (a toolbar, a compact action), and `root.accepts` lets an icon stand alone,
      // without a mandatory label next to it.
      tree: { part: "root", children: [{ genus: "icon", value: "★" }] },
    },
  ],
});
