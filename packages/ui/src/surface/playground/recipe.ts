// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`) — не поставка, не вкус продукта. Живёт рядом с компонентом,
// но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — его читает только
// `surface.test.tsx`, доказывая, что паспорт поверхности МОЖНО одеть целиком настоящей механикой
// скина. Раньше то же доказывал отдельный пакет `packages/skin-reference` (снесён, `PWEB-110`).
//
// Перенесено построчно из `packages/skin-reference/src/recipes.ts` (git-история цела на
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); вид не менялся при переезде.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/**
 * ПОВЕРХНОСТЬ. Одна часть, состояний нет, две вариации.
 *
 * Первая ступень — фон приложения, вторая — он же приглушённый: приподнятая поверхность
 * отделяется от страницы именно светлотой, а не тенью.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "block",
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "var(--neutral-1)",
        color: "var(--neutral-12)",
        fontSize: "var(--font-size-md)",
        lineHeight: "var(--leading-normal)",
      },
    },
  },
  variants: {
    обычная: { root: { props: { background: "var(--neutral-1)", color: "var(--neutral-12)" } } },
    приподнятая: {
      root: {
        props: {
          background: "var(--neutral-2)",
          color: "var(--neutral-12)",
          borderWidth: "var(--border-width-1)",
          borderStyle: "solid",
          borderColor: "var(--neutral-6)",
        },
      },
    },
  },
  defaultVariant: "обычная",
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "поверхность-проба", component: "surface", recipe };
