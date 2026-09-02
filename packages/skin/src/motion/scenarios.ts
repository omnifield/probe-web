// Design notes: ./README.md#scenarios

import type { Keyframes } from "../recipe/index.js";

/**
 * Готовые ступени именованного движения для «вырасти/сжаться по измеренному размеру» — тот же
 * приём, что у `STEP_PURPOSE`/`SPACE_ROLES` (`packages/style`): одна идея, одно имя, а не
 * буквальный `@keyframes`, переписанный заново в каждом компоненте. Найдено живьём: аккордеон
 * (`packages/ui/src/accordion/playground/recipe.ts`) написал ровно эту пару дважды — для высоты
 * и для ширины, — прежде чем где-либо появился второй ПОТРЕБИТЕЛЬ той же идеи.
 *
 * `--height`/`--width` — НЕ наши имена: их кладёт на узел кит, измерив раскрытие/задвижку
 * (`../passport/form/README.md#variable`). Сценарий на них ссылается, а не изобретает свои —
 * ссылка резолвится на анимируемом узле, и это ОБЯЗАН быть тот же узел, где применено движение.
 *
 * ИМЕНА ФИКСИРОВАНЫ, и это часть решения, а не только контракт содержимого. Два компонента,
 * взявшие один и тот же сценарий, кладут в наряд ОДИНАКОВЫЕ ступени под одним и тем же именем —
 * слияние (`Object.assign`, `../look/assemble.ts`) их не различает и не обязано: это буквально
 * одна и та же анимация, а не два разных куска с совпавшим именем. Коллизию (`keyframe-collision`,
 * `../look/check.ts`) ловит именно РАСХОЖДЕНИЕ содержимого, не совпадение имени само по себе.
 *
 * Свойства — ЛОГИЧЕСКИЕ (`blockSize`/`inlineSize`), а не `height`/`width`: тем же доводом, что и
 * весь остальной кит (`paddingInline`, `borderInlineStartColor`, …) — направление письма решает
 * автор документа, а не сценарий движения.
 */
export const GROW_SHRINK_BLOCK: Keyframes = {
  "grow-block-size": {
    from: { blockSize: "0" },
    to: { blockSize: "var(--height)" },
  },
  "shrink-block-size": {
    from: { blockSize: "var(--height)" },
    to: { blockSize: "0" },
  },
};

export const GROW_SHRINK_INLINE: Keyframes = {
  "grow-inline-size": {
    from: { inlineSize: "0" },
    to: { inlineSize: "var(--width)" },
  },
  "shrink-inline-size": {
    from: { inlineSize: "var(--width)" },
    to: { inlineSize: "0" },
  },
};
