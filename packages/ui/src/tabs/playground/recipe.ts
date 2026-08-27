// PROOF RECIPE (`PWEB-111`) — not a shipped product, not product taste. Lives next to the
// component, but is NEVER exported from `index.ts`/`passport.ts`/`kit.ts`. Same physical shape as
// every other component's `playground/recipe.ts` (`PWEB-127`).
//
// THREE NAMED STYLES (`line`/`enclosed`/`pills`) — the visible, well-known tab treatments (line
// matches ark-ui.com's own reference demo; enclosed and pills are the two other market standards,
// same family as Radix's/Chakra's own tab variants). Both `orientation` settings values
// (`horizontal`/`vertical`) work for every one of them.
//
// ## Why the indicator's SHAPE lives in base+settings, not in the variants
//
// The model does not support a variant×setting intersection (`recipe.ts`, `SlotRecipe.settings`:
// "Пересечения настройки с вариацией здесь НЕТ намеренно") — there is no single rule addressable
// as "this variant, AND this orientation". Groups are layered `base → settings → variants →
// compoundVariants` (`look.ts`, `recipeGroups`), so for a property BOTH a variant and a settings
// rule touch, the variant always wins (it is emitted later) — regardless of orientation.
//
// The base indicator is shaped as a thin horizontal bar (the `line` look, ark-ui's own default);
// `settings.orientation.vertical` reshapes it into a thin vertical bar — this pair alone already
// gives `line` a correct indicator in BOTH orientations, because `line`'s own variant entry never
// touches the indicator's geometry at all (nothing to override with). `enclosed` hides the
// indicator outright (selection is carried by the trigger's own background/border instead) and
// `pills` replaces the geometry with a full rect matching the trigger's own box — both of those
// overrides apply AFTER settings regardless of axis, which is exactly why they still work
// correctly under `vertical`: the variant's own fixed values simply replace whatever settings
// computed, on every axis alike.
//
// `indicator`'s `--left`/`--top`/`--width`/`--height` are the kit's own measured, sliding position
// (`../entity/passport.ts`) — the same device as the accordion's `--height`.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

const transition = "color var(--motion-fast) var(--ease-out), background-color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";
const slide = "left var(--motion-normal) var(--ease-out), top var(--motion-normal) var(--ease-out), width var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "flex", flexDirection: "column", gap: "var(--space-3)" },
    },
    list: {
      props: {
        display: "flex",
        flexDirection: "row",
        position: "relative",
        gap: "var(--space-1)",
        borderBlockEnd: "var(--border-width-1) solid var(--neutral-6)",
      },
      states: { focus: {} },
    },
    trigger: {
      props: {
        position: "relative",
        zIndex: "1",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderWidth: "0",
        borderRadius: "var(--radius-md)",
        background: "transparent",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        cursor: "pointer",
        transition,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        selected: { props: { color: "var(--neutral-12)" } },
        hover: { props: { color: "var(--neutral-12)" } },
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--accent-8)",
            outlineOffset: "calc(var(--border-width-2) * -1)",
          },
        },
        active: { props: { color: "var(--neutral-12)" } },
        disabled: { props: { color: "var(--neutral-8)", cursor: "not-allowed" } },
        focus: {},
      },
    },
    content: {
      props: {
        paddingBlock: "var(--space-4)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-relaxed)",
      },
      states: { selected: {} },
    },
    // База — тонкая ГОРИЗОНТАЛЬНАЯ полоса под активным табом: это и есть стиль `line`, поэтому
    // его собственная запись в `variants` ниже пуста — переопределять нечего.
    indicator: {
      props: {
        position: "absolute",
        zIndex: "0",
        left: "var(--left)",
        width: "var(--width)",
        height: "var(--border-width-2)",
        top: "calc(var(--top) + var(--height) - var(--border-width-2))",
        background: "var(--accent-9)",
        borderRadius: "var(--radius-full)",
        transition: slide,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
    },
  },
  variants: {
    // Пусто — база УЖЕ line: полоса под активным табом, как в эталоне ark-ui.com.
    line: {},

    // Рамка вместо полосы: активный таб приподнят (свой фон и рамка на трёх сторонах), соседи
    // приглушены. Индикатор скрыт — выбор несёт сама рамка, второй знак поверх был бы лишним.
    enclosed: {
      list: { props: { borderBlockEnd: "var(--border-width-1) solid var(--neutral-6)", gap: "var(--space-1)" } },
      trigger: {
        props: {
          borderWidth: "var(--border-width-1)",
          borderStyle: "solid",
          borderColor: "transparent",
          borderEndStartRadius: "0",
          borderEndEndRadius: "0",
          background: "var(--neutral-2)",
          marginBlockEnd: "calc(var(--border-width-1) * -1)",
        },
        states: {
          selected: {
            props: {
              background: "var(--neutral-1)",
              borderColor: "var(--neutral-6)",
              borderBlockEndColor: "var(--neutral-1)",
            },
          },
          hover: { props: { background: "var(--neutral-3)" } },
        },
      },
      indicator: { props: { display: "none" } },
    },

    // Заливка вместо рамки: индикатор — сама подложка, едущая под текстом (`zIndex: 0` у него,
    // `zIndex: 1` у текста триггера — тот же порядок, что и у базы). Дорожка под рядом табов —
    // приглушённый фон, тот же приём, что у сегментированного переключателя в остальных китах.
    pills: {
      list: {
        props: {
          borderBlockEnd: "none",
          background: "var(--neutral-3)",
          padding: "var(--space-1)",
          borderRadius: "var(--radius-lg)",
        },
      },
      trigger: {
        props: { borderRadius: "var(--radius-md)" },
        states: { selected: { props: { color: "var(--accent-contrast)" } } },
      },
      indicator: {
        props: {
          display: "block",
          left: "var(--left)",
          top: "var(--top)",
          width: "var(--width)",
          height: "var(--height)",
          background: "var(--accent-9)",
          borderRadius: "var(--radius-md)",
        },
      },
    },
  },
  defaultVariant: "line",
  settings: {
    orientation: {
      vertical: {
        root: { props: { flexDirection: "row" } },
        list: {
          props: {
            flexDirection: "column",
            borderBlockEnd: "none",
            borderInlineEnd: "var(--border-width-1) solid var(--neutral-6)",
          },
        },
        // Полоса РЯДОМ, не ПОД: тонкая вертикальная планка на боковой кромке трогера. Работает
        // только пока вариация не переопределила геометрию сама (`line`) — `enclosed`/`pills`
        // выше берут своё вне зависимости от оси, ровно как задумано (см. шапку файла).
        indicator: {
          props: {
            left: "0",
            width: "var(--border-width-2)",
            top: "var(--top)",
            height: "var(--height)",
          },
        },
      },
    },
  },
};

/** Form — the "name + component + recipe" record `assemble` accepts. */
export const form: Form = { name: "tabs-sample", component: "tabs", recipe };
