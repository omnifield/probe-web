// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `PWEB-154`) — не поставка, не вкус продукта. Живёт рядом с
// компонентом, но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — тот же приём,
// что у сетки и поверхности (`grid/playground/recipe.ts`, `surface/playground/recipe.ts`),
// доказывающий, что паспорт МОЖНО одеть целиком настоящей механикой скина. Настоящий рецепт
// продукта живёт формой `omnifield-workspace` в службе пресетов, не здесь.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/**
 * РАБОЧАЯ ОБЛАСТЬ. Пять частей, состояний нет, вариаций нет — форма ОДНА (в отличие от сетки,
 * которой три разных вида нужны трём разным потребителям: здесь потребитель один, и это сам
 * каркас приложения).
 *
 * ОДНА СЕТКА, ИМЕНОВАННЫЕ ОБЛАСТИ (`grid-template-areas`), А НЕ ДВЕ ВЛОЖЕННЫЕ: `sidebar` стоит
 * во ВТОРОЙ колонке ОБЕИХ строк сразу — во всю высоту, рядом и с шапкой, и с показом, — `header`
 * только в первой строке. Так же, как выражала это прежняя пара вложенных `Grid` в `products/
 * skin/src/app/app.tsx` (вариации `sidebar`+`stack`, `grid/playground/recipe.ts`), но одним
 * компонентом и без вложенности, которую раньше приходилось строить руками.
 *
 * КОЛОНКА `rightbar` — `auto`: не положен узел `WorkspaceRightbar` в сборку — грид не резервирует
 * под именованную область ничего сверх того, что просит её содержимое, и колонка схлопывается
 * сама, без условия в разметке потребителя (`../components/index.tsx`, «`rightbar` необязателен
 * НАСТОЯЩИМ образом»).
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "grid",
        gridTemplateAreas: '"sidebar header header" "sidebar main rightbar"',
        gridTemplateColumns: "minmax(var(--space-32), var(--column-24)) 1fr auto",
        gridTemplateRows: "auto 1fr",
        blockSize: "100%",
        minBlockSize: "0",
      },
    },
    header: { props: { gridArea: "header", minInlineSize: "0" } },
    sidebar: { props: { gridArea: "sidebar", minBlockSize: "0" } },
    main: { props: { gridArea: "main", minInlineSize: "0", minBlockSize: "0", overflow: "auto" } },
    rightbar: { props: { gridArea: "rightbar", minBlockSize: "0" } },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "рабочая-область-проба", component: "workspace", recipe };
