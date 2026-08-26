// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`) — не поставка, не вкус продукта. Живёт рядом с компонентом,
// но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — его читает только
// `flow.test.tsx`, доказывая, что паспорт потока МОЖНО одеть целиком настоящей механикой скина.
// Раньше то же доказывал отдельный пакет `packages/skin-reference` (снесён, `PWEB-110`).
//
// Перенесено построчно из `packages/skin-reference/src/recipes.ts` (git-история цела на
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); вид не менялся при переезде.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/**
 * ПОТОК. Раскладка в ряд с переносом: две части, состояний нет, вариаций нет.
 *
 * Раскладка — вид, а не поведение: она меняет то, КАК компонент выглядит, и не меняет того, что
 * он показывает. Поэтому она законна в скине.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "var(--space-3)",
      },
    },
    item: { props: { display: "block", minWidth: "0" } },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "поток-проба", component: "flow", recipe };
