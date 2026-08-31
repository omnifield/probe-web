// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — meant to prove the
// listbox's passport CAN be dressed whole by the real skin mechanism, the same role the
// accordion's/button's/select's own recipes play.
//
// Base stays close to the select's own shapes for the parts they share (`content`'s border,
// `item`'s hover/highlighted/checked/disabled) — a listbox reads as a select's dropdown content
// with the trigger removed, always open. `itemIndicator` hides itself while unchecked the same
// way the select's own does (native `hidden`, `display` only turned back on for `checked` — a
// blanket `display` in `base` would show every unchecked checkmark at once).
//
// TWO VARIANTS — `comfortable` (default) and `compact`. Not a color axis like the button's own
// `primary`/`quiet`/`danger`: a listbox's defining trade-off is density, not emphasis — how many
// rows fit before scrolling starts, the one thing a plain list is actually judged on. Two is
// enough to prove the mechanism intersects states correctly (`item`'s `highlighted`/`checked`
// still apply under either) without inventing a third value nobody asked for.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same device as the rest of the kit: different durations on neighbors is a defect. */
const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)";

/**
 * LISTBOX. Eleven parts; `content` carries the border, `item` carries the selection look.
 *
 * No floating layer at all (`../entity/passport.ts` — no `open`/`closed` anywhere), so unlike the
 * select's own `content`, there is no `positioner` to size against a trigger: `content` gets a
 * plain `max-height` and scrolls on its own.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-2)",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
      },
    },
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    input: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        transition: "border-color var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        disabled: {
          props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)", cursor: "not-allowed" },
        },
      },
    },
    content: {
      props: {
        display: "flex",
        flexDirection: "column",
        // Zag gives `content` `tabIndex: 0` (`listbox.connect.mjs`, `getContentProps`) — the
        // browser's own default focus ring draws on it after a click, same as any focusable
        // element with no `outline` of its own. Selection is already shown on the ITEM (its own
        // `checked`/`highlighted` marks); the container itself needs no visible ring at all.
        outline: "none",
      },
      states: {
        // No items to scroll to — the row layout the base otherwise uses for items would leave a
        // thin, off-center message; centered feels intentional instead of an empty accident.
        empty: {
          props: { alignItems: "center", justifyContent: "center", minHeight: "6rem" },
        },
      },
    },
    itemGroup: {
      props: {
        display: "flex",
        flexDirection: "column",
      },
      states: {
        disabled: { props: { opacity: "0.6" } },
      },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    item: {
      props: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        color: "var(--neutral-12)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      // TEXT color, not a block background (found live, 2026-08-30 — a full-row fill read as an
      // unstyled white slab once the listbox actually shipped inside a real composition): the
      // selected row marks itself the same way a link or an active tab does, by its own color,
      // not by painting the row underneath it.
      states: {
        highlighted: { props: { color: "var(--neutral-12)" } },
        checked: { props: { color: "var(--accent-9)", fontWeight: "var(--weight-medium)" } },
        disabled: { props: { color: "var(--neutral-11)", cursor: "not-allowed" } },
      },
    },
    itemText: {
      props: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      },
    },
    // `display` NOT in the base, same reasoning as the select's own `itemIndicator`: the kit
    // hides an unchecked indicator with native `hidden`, and an unconditional `display` here
    // would override it for every row at once — every checkmark would show simultaneously.
    itemIndicator: {
      props: { color: "var(--accent-9)" },
      states: { checked: { props: { display: "inline-flex" } } },
    },
    valueText: {
      props: {
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-10)" } },
      },
    },
    empty: {
      props: {
        fontSize: "var(--font-size-sm)",
        color: "var(--neutral-11)",
      },
    },
  },
  variants: {
    comfortable: {
      content: { props: { gap: "var(--space-1)", padding: "var(--space-1)" } },
      item: { props: { paddingInline: "var(--space-3)", paddingBlock: "var(--space-2)" } },
      itemGroupLabel: { props: { paddingBlock: "var(--space-2)" } },
    },
    compact: {
      // `gap: 0` — no extra step between rows on top of the item's OWN `paddingBlock: space-1`:
      // that padding already sits on both sides of every row, so two adjacent rows land space-1
      // apart without a second gap doubling it. `comfortable` still names an explicit gap because
      // its own `paddingBlock: space-2` is looser and reads thin without one.
      //
      // `content.padding: 0` — an outer frame around rows that ALREADY carry their own
      // `paddingInline` doubles the same offset twice; found live, 2026-08-30, composed inside
      // the accordion's own `itemContent` (its own padding, `packages/ui/src/accordion/
      // playground/recipe.ts` proof / the worn `omnifield-accordion` form) — three padded layers
      // stacked read as one oversized one.
      content: { props: { gap: "0", padding: "0" } },
      item: { props: { paddingInline: "var(--space-1)", paddingBlock: "var(--space-1)" } },
      itemGroupLabel: { props: { paddingBlock: "var(--space-1)", fontSize: "var(--font-size-xs)" } },
    },
  },
  defaultVariant: "comfortable",
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "listbox-sample", component: "listbox", recipe };
