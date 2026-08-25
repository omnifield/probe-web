// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`) — не поставка, не вкус продукта. Живёт рядом с компонентом,
// но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — его читает только
// `grid.test.tsx`, доказывая, что паспорт сетки МОЖНО одеть целиком настоящей механикой скина.
// Раньше то же доказывал отдельный пакет `packages/skin-reference` (снесён, `PWEB-110`).
//
// Перенесено построчно из `packages/skin-reference/src/recipes.ts` (git-история цела на
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); вид не менялся при переезде.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/**
 * СЕТКА. Колонки от ширины читаемой колонки: две части, состояний нет, вариаций нет.
 *
 * Ширина берётся ступенью колонки, а не числом колонок: число зависит от места, а ступень — от
 * того, сколько знаков в строке остаётся читаемым.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "grid",
        gap: "var(--space-4)",
        gridTemplateColumns: "repeat(auto-fill, minmax(var(--column-32), 1fr))",
      },
    },
    cell: { props: { display: "block", minWidth: "0" } },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "сетка-проба", component: "grid", recipe };
