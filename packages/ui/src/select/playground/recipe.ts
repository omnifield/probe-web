// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts` — meant to prove the
// select's passport CAN be dressed whole by the real skin mechanism, the same role the
// accordion's and the button's own recipes play.
//
// Fifteen parts, most of them sharing one look concern (`control`'s border communicates the same
// thing whether it comes from focus, invalidity, or disabledness) — the base stays close to the
// button's own shapes (height, radius, border) since a closed select reads as a button that opens
// something. No shadow anywhere: the token scale (`packages/style`) has no elevation/shadow scale
// at all yet, and a proof recipe does not invent a token the rest of the kit cannot also reach for.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Look transition — same device as the rest of the kit: different durations on neighbors is a defect. */
const transition = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * SELECT. Fifteen parts; the control carries the border, the content carries the floating shadow.
 *
 * The floating content is sized against the trigger it belongs to (`--reference-width`) and
 * capped by whatever room the viewport actually has (`--available-height`) — without either, a
 * narrow trigger would open a dropdown wider than itself, or a long list would run off-screen with
 * nothing to stop it.
 */
export const recipe: SlotRecipe = {
  base: {
    label: {
      props: {
        fontSize: "var(--font-size-md)",
        color: "var(--neutral-12)",
      },
      states: {
        disabled: { props: { color: "var(--neutral-11)" } },
      },
    },
    control: {
      props: {
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-7)",
        background: "var(--neutral-1)",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        focus: { props: { borderColor: "var(--accent-8)" } },
        invalid: { props: { borderColor: "var(--danger-9)" } },
        disabled: { props: { borderColor: "var(--neutral-6)", background: "var(--neutral-3)" } },
      },
    },
    trigger: {
      props: {
        display: "flex",
        flex: "1",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        background: "transparent",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-none)",
        textAlign: "start",
        cursor: "pointer",
      },
      states: {
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        disabled: { props: { cursor: "not-allowed" } },
      },
    },
    valueText: {
      props: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
      // `placeholder` НЕ СОСТОЯНИЕ ЭТОЙ ЧАСТИ (`entity/passport.ts`: valueText объявляет только
      // disabled/invalid/focus) — признак стоит на `trigger`, который её содержит. Адресуем через
      // предка, тем же приёмом, что аккордеон красит содержимое по состоянию своего пункта.
      states: { disabled: { props: { color: "var(--neutral-11)" } } },
      ancestors: [
        {
          component: "select",
          part: "trigger",
          states: ["placeholder"],
          style: { props: { color: "var(--neutral-11)" } },
        },
      ],
    },
    clearTrigger: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: "var(--space-2)",
        color: "var(--neutral-11)",
        cursor: "pointer",
      },
      states: {
        hover: { props: { color: "var(--neutral-12)" } },
        disabled: { props: { cursor: "not-allowed", opacity: "0.5" } },
      },
    },
    indicator: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        paddingInline: "var(--space-2)",
        color: "var(--neutral-11)",
        transition: "transform var(--motion-fast) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        open: { props: { transform: "rotate(180deg)" } },
      },
    },
    // РАЗМЕР ОГРАНИЧИВАЕТ `positioner`, А НЕ `content`: паспорт ставит `--available-width`/
    // `--available-height` на `positioner` (`entity/passport.ts`) — узел, который реально их
    // несёт. `content` эти же переменные читал раньше СЕБЕ, а не своему родителю: механика
    // скина это отвергает («переменную объявляет паспорт, но на другой части») — правило
    // приехало бы на страницу с неразрешимым значением. `content` внутри просто прокручивается.
    positioner: {
      props: {
        maxWidth: "var(--available-width)",
        maxHeight: "var(--available-height)",
      },
    },
    content: {
      props: {
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
        padding: "var(--space-1)",
        overflow: "auto",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        borderColor: "var(--neutral-6)",
        background: "var(--neutral-1)",
      },
    },
    itemGroupLabel: {
      props: {
        paddingInline: "var(--space-3)",
        paddingBlock: "var(--space-2)",
        fontSize: "var(--font-size-sm)",
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
        borderRadius: "var(--radius-sm)",
        color: "var(--neutral-12)",
        cursor: "pointer",
      },
      states: {
        highlighted: { props: { background: "var(--neutral-4)" } },
        checked: { props: { fontWeight: "var(--weight-medium)" } },
        disabled: { props: { color: "var(--neutral-11)", cursor: "not-allowed" } },
      },
    },
    // `display` НЕ В БАЗЕ: кит прячет неотмеченный индикатор атрибутом `hidden` (нативный
    // `display: none`), и безусловный `display: inline-flex` в базе перебил бы его для КАЖДОГО
    // пункта разом — все галочки были бы видны одновременно. Ставим `display` только вместе с
    // `checked`, когда `hidden` уже снят китом и узел реально показан.
    itemIndicator: {
      props: { color: "var(--accent-9)" },
      states: { checked: { props: { display: "inline-flex" } } },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "select-sample", component: "select", recipe };
