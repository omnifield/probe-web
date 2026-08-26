// ewc's own tiny skin — no store service behind it (unlike `products/skin`), just a Skin literal
// wired straight into the switch, the same shape `apps/reference/src/skin.ts` uses. It exists to
// prove two things live: a light/dark mode switch, and one dressed kit component (Button).
import { withPassports, type Skin } from "@omnifield/probe-web-skin";
import { makeSkinSwitch, type SkinSwitch } from "@omnifield/probe-web-runtime";
import { passportOf } from "@omnifield/probe-web-ui/passport";

const { generateSkinCss } = withPassports(passportOf);

export const EWC_SKIN: Skin = {
  name: "ewc",
  variables: {
    dimensions: { radius: "0.5rem" },
    light: {
      "ewc-bg": "#f6f6f7",
      "ewc-fg": "#1a1a1a",
      "ewc-accent": "#3355ff",
      "ewc-accent-fg": "#ffffff",
      "ewc-round": "var(--radius-md)",
    },
    // Only what differs from light — dark falls back to light for anything left unset.
    dark: {
      "ewc-bg": "#131316",
      "ewc-fg": "#ededef",
      "ewc-accent": "#7c9bff",
      "ewc-accent-fg": "#0b0b0d",
    },
  },
  recipes: {
    button: {
      base: {
        root: {
          props: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            border: "none",
            borderRadius: "var(--ewc-round)",
            font: "inherit",
            fontWeight: 600,
            cursor: "pointer",
            background: "var(--ewc-accent)",
            color: "var(--ewc-accent-fg)",
          },
          states: {
            disabled: { props: { opacity: "0.5", cursor: "default" } },
          },
        },
      },
    },
  },
};

/** Builds the switch and wires it to this file's one and only skin — nothing to pick a name from. */
export function makeEwcSkin(): SkinSwitch {
  return makeSkinSwitch({
    names: () => [EWC_SKIN.name],
    css: (name) => {
      if (name !== EWC_SKIN.name) throw new Error(`[ewc] no such skin: ${name}`);
      return generateSkinCss(EWC_SKIN);
    },
  });
}
