// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`) — не поставка, не вкус продукта. Живёт рядом с компонентом,
// но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — его читает только
// `button.test.tsx`, доказывая, что паспорт кнопки МОЖНО одеть целиком настоящей механикой скина.
// Раньше то же доказывал отдельный пакет `packages/skin-reference` (снесён, `PWEB-110`).
//
// Перенесено построчно из `packages/skin-reference/src/recipes.ts` (git-история цела на
// `git show 5d560ae:packages/skin-reference/src/recipes.ts`); вид не менялся при переезде.
//
// Три вариации (`главная`, `тихая`, `опасная`) плюс умолчание — кнопка несёт ось целиком: на ней
// и умолчание, и пересечения вариации с состоянием. Меньше трёх не хватило бы — с двумя
// «пересечение по нескольким вариациям сразу» выродилось бы в «по одной».

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/** Переход вида — тот же приём, что у гармошки: разные длительности у соседних узлов — брак. */
const переход = "background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out), border-color var(--motion-fast) var(--ease-out)";

/**
 * КНОПКА. Одна часть, семь состояний, три вариации.
 *
 * Высота берётся ступенью `--control-height-md`, а не порогом нормы: при плотности 1 ступень
 * выше минимального размера цели с запасом.
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        minHeight: "var(--control-height-md)",
        paddingInline: "var(--space-4)",
        borderRadius: "var(--radius-md)",
        borderWidth: "var(--border-width-1)",
        borderStyle: "solid",
        fontSize: "var(--font-size-md)",
        fontWeight: "var(--weight-medium)",
        lineHeight: "var(--leading-none)",
        letterSpacing: "var(--tracking-normal)",
        cursor: "pointer",
        transition: переход,
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      states: {
        // Кольцо фокуса — восьмая ступень: она и есть «сильная граница и кольцо фокуса».
        "focus-visible": {
          props: {
            outline: "var(--border-width-2) solid var(--акцент-8)",
            outlineOffset: "var(--space-1)",
          },
        },
        hover: { props: { cursor: "pointer" } },
        active: { props: { transform: "translateY(var(--border-width-1))" } },
        disabled: {
          props: { opacity: "0.5", cursor: "not-allowed" },
          states: { hover: { props: { transform: "none" } } },
        },
        busy: { props: { cursor: "progress" } },
        expanded: { props: { borderColor: "var(--акцент-8)" } },
        pressed: { props: { borderColor: "var(--акцент-8)", fontWeight: "var(--weight-semibold)" } },
      },
    },
  },
  variants: {
    главная: {
      root: {
        props: {
          background: "var(--акцент-9)",
          color: "var(--акцент-contrast)",
          // Рамка есть и невидима НАМЕРЕННО: она держит коробку сплошной кнопки того же
          // размера, что у обведённой. Счёт читаемости назовёт её «посчитать нечем» — верный
          // ответ: что лежит под полностью прозрачным, значение не говорит.
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--акцент-10)", color: "var(--акцент-contrast)" } },
        },
      },
    },
    тихая: {
      root: {
        props: {
          background: "var(--нейтраль-3)",
          color: "var(--нейтраль-12)",
          borderColor: "var(--нейтраль-7)",
        },
        states: {
          hover: { props: { background: "var(--нейтраль-4)", color: "var(--нейтраль-12)" } },
          active: { props: { background: "var(--нейтраль-5)", color: "var(--нейтраль-12)" } },
        },
      },
    },
    опасная: {
      root: {
        props: {
          background: "var(--опасность-9)",
          color: "var(--опасность-contrast)",
          borderColor: "transparent",
        },
        states: {
          hover: { props: { background: "var(--опасность-10)", color: "var(--опасность-contrast)" } },
        },
      },
    },
  },
  defaultVariant: "главная",
  compoundVariants: [
    {
      // Общее для ДВУХ сплошных вариаций сразу — ровно тот случай, ради которого пересечение и
      // существует: вложением его пришлось бы написать дважды.
      variants: ["главная", "опасная"],
      states: ["active"],
      style: { root: { props: { filter: "brightness(0.94)" } } },
    },
  ],
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "кнопка-проба", component: "button", recipe };
