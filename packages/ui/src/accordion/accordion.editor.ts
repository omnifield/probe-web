// EDITOR-ONLY metadata for the accordion (`PWEB-115`, `PWEB-118`, decomposed `PWEB-124`).
//
// Human-facing text, taxonomy, nesting rules, and assembly templates for the visual editor and
// for agents reading the catalog — never for the running app. See `button.editor.ts` for the full
// argument (Storybook `argTypes`/docs vs. component code, Zag/Ark's own `anatomy.ts`); the short
// version: `defineEditorInfo` depends one-way on `passport` (the runtime contract in
// `accordion.anatomy.ts`), and nothing flows back, so a production bundle that never imports
// `/editor` never pays for a single word written below.
//
// Nesting is declared TWO levels deep: the item inside the root, the trigger and the content
// inside the item. This is the first place where the nesting rule is checkable at all — the
// button has no internal parts, and there was nothing to derive "who can be an ancestor" from.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "./accordion.anatomy.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  // The provider is US, not Ark: the component ships outward as our own delivery, and a passport
  // reader records exactly that. A test guards the match against the manifest.
  package: "@omnifield/probe-web-ui",
  genus: "component",
  // Place in the catalog (`PWEB-34`): something that expands and collapses.
  group: "disclosure",
  variantAxis: {
    means: "the variant name a human gives the accordion in the editor; the kit passes it through untouched",
  },
  parts: {
    root: {
      means: "the whole set of items — one node wrapping every item",
      accepts: [{ kind: "part", name: "item" }],
    },
    item: {
      means: "one item — a trigger together with its content",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        disabled: { means: "the item is disabled — it cannot be expanded" },
        focus: { means: "focus is on this item's trigger" },
      },
      accepts: [
        { kind: "part", name: "itemTrigger" },
        { kind: "part", name: "itemContent" },
      ],
    },
    itemTrigger: {
      means: "the item's button — expands and collapses it",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        focus: { means: "focus is on this item's trigger" },
        disabled: { means: "the button is disabled — clicking it does not expand the item" },
        hover: { means: "pointer is over the button" },
        "focus-visible": { means: "focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise" },
        active: { means: "the button is being held down" },
      },
      accepts: [
        { kind: "part", name: "itemIndicator" },
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
    itemContent: {
      means: "the item's content — the area that gets expanded",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        closed: { means: "the item is collapsed — its content is hidden, but the node stays in place" },
        disabled: { means: "the item is disabled — it cannot be expanded" },
        focus: { means: "focus is on this item's trigger" },
      },
      variables: {
        "--height": { means: "the measured height of the expanded content" },
        "--width": { means: "the measured width of the expanded content — needed by a horizontal accordion" },
      },
      // Anything goes inside an item's content — this is the consumer's spot, not ours: text, an
      // icon, any component. An empty list here would mean there is nothing to expand.
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "component" },
      ],
    },
    itemIndicator: {
      means: "the expansion indicator — an arrow placed by the consumer",
      states: {
        open: { means: "the item is expanded — its content is visible" },
        disabled: { means: "the item is disabled — it cannot be expanded" },
        focus: { means: "focus is on this item's trigger" },
      },
      accepts: [
        { kind: "content", genus: "text" },
        { kind: "content", genus: "icon" },
      ],
    },
  },
  settings: {
    orientation: {
      means: "how items are laid out: top to bottom or left to right — this drives keyboard navigation and aria",
      options: {
        vertical: { means: "top to bottom" },
        horizontal: { means: "left to right" },
      },
    },
    multiple: { means: "whether several items can stay expanded at once" },
    collapsible: { means: "whether the last expanded item can be closed, leaving the whole accordion collapsed" },
  },
  // SEVERAL ASSEMBLY TEMPLATES (`PWEB-116`) — not one showcase, but a constructor with
  // instructions for several distinct cases. An agent that needs an accordion of a particular
  // shape takes a ready, working instance instead of inventing one from scratch on every request.
  //
  // Each assembly is REAL, by the same argument as before (`PWEB-89`): it is assembled by the
  // assembly mechanism with no touch-up from the consumer, checked by a test on EVERY entry
  // (`test/base-assembly.test.tsx`), not only the first.
  //
  // The axes assemblies differ along, and why exactly these and nothing else:
  //   • number of items — a 3-item accordion and a 6-item one present themselves differently: on
  //     a large one the item list itself becomes the content, on a small one it does not;
  //   • which item is expanded initially — first, last, or none: that is exactly the provider's
  //     own knowledge (the `value` inside `defaultValue`) that a consumer does not invent;
  //   • `multiple` — several expanded at once, not one; without walking `defaultValue` with two
  //     values THIS cannot be seen — `multiple: true` in the root's props is a prop THIS assembly
  //     requires, not a look (`PWEB-89`);
  //   • composition inside `itemTrigger` — an icon BEFORE the label, next to the expansion
  //     indicator, not just the disclosure control on its own. The icon here is a placeholder
  //     (`★`), the same device as the indicator (`⌄`): the base assembly is data, not code, and a
  //     real `lucide-solid` component cannot be placed in it (`icon.anatomy.ts`, "no assembly base").
  //
  // Composition with states (hovered, disabled) is deliberately not placed here: an assembly has
  // no state axis, whoever displays it sets the state (see the note about expansion above).
  assemblies: [
    {
      means: "three items, the first expanded",
      tree: {
        part: "root",
        props: { defaultValue: ["item-1"] },
        children: [
          {
            part: "item",
            props: { value: "item-1" },
            children: [
              {
                part: "itemTrigger",
                // The label FIRST, the indicator after: content order relative to parts is the
                // view author's call, and can only be expressed as one flat list of children.
                children: [
                  { genus: "text", value: "Item 1" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "This is what gets expanded." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-2" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 2" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The second item is collapsed." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-3" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 3" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The third item is collapsed." }],
              },
            ],
          },
        ],
      },
    },
    {
      means: "three items, the last expanded",
      tree: {
        part: "root",
        // The same item count as the first assembly — the only difference is WHICH is expanded.
        // Had everything else matched too, the difference would be lost in the noise of item
        // count.
        props: { defaultValue: ["item-3"] },
        children: [
          {
            part: "item",
            props: { value: "item-1" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 1" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The first item is collapsed." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-2" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 2" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The second item is collapsed." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-3" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 3" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "This is what gets expanded." }],
              },
            ],
          },
        ],
      },
    },
    {
      means: "two items expanded at the same time",
      tree: {
        part: "root",
        // `multiple: true` is a prop THIS assembly requires: without it Zag ignores the second
        // `defaultValue` entry, and "two expanded at once" does not assemble — it silently
        // collapses to one. This is not a look (it has no place there, `PWEB-89`) — it is what
        // the assembly does not work without, the same sense as an item's `value`.
        props: { multiple: true, defaultValue: ["item-1", "item-2"] },
        children: [
          {
            part: "item",
            props: { value: "item-1" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 1" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The first item is expanded." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-2" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 2" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The second item is expanded too." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-3" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: "Item 3" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The third item is collapsed." }],
              },
            ],
          },
        ],
      },
    },
    {
      means: "six items, none expanded initially",
      tree: {
        part: "root",
        // An empty list — the same honest default as a setting with no value: none are expanded,
        // not "forgot to name one". Six items is not about margin — it is the assembly's whole
        // point: a list longer than can be told apart from "one more instance of three" by eye
        // becomes content in its own right, not just a count.
        props: { defaultValue: [] },
        children: Array.from({ length: 6 }, (_, index) => {
          const number = index + 1;
          const value = `item-${number}`;

          return {
            part: "item",
            props: { value },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "text", value: `Item ${number}` },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: `Content of item ${number}.` }],
              },
            ],
          };
        }),
      },
    },
    {
      means: "an item with an icon before its label",
      tree: {
        part: "root",
        props: { defaultValue: ["item-1"] },
        children: [
          {
            part: "item",
            props: { value: "item-1" },
            children: [
              {
                part: "itemTrigger",
                // The icon LEADS the label, the expansion indicator follows it: composition of
                // three pieces of content at once, not just text and an indicator like the other
                // assemblies.
                children: [
                  { genus: "icon", value: "★" },
                  { genus: "text", value: "Item with an icon" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "This is what gets expanded." }],
              },
            ],
          },
          {
            part: "item",
            props: { value: "item-2" },
            children: [
              {
                part: "itemTrigger",
                children: [
                  { genus: "icon", value: "★" },
                  { genus: "text", value: "Second item with an icon" },
                  { part: "itemIndicator", children: [{ genus: "text", value: "⌄" }] },
                ],
              },
              {
                part: "itemContent",
                children: [{ genus: "text", value: "The second item is collapsed." }],
              },
            ],
          },
        ],
      },
    },
  ],
});
