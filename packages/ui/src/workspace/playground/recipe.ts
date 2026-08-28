// РЕЦЕПТ-ДОКАЗАТЕЛЬСТВО (`PWEB-111`, `PWEB-154`, `PWEB-161`) — не поставка, не вкус продукта.
// Живёт рядом с компонентом, но НИКУДА не экспортируется из `index.ts`/`passport.ts`/`kit.ts` —
// тот же приём, что у сетки и поверхности (`grid/playground/recipe.ts`, `surface/playground/
// recipe.ts`), доказывающий, что паспорт МОЖНО одеть целиком настоящей механикой скина. Настоящий
// рецепт продукта живёт формой `omnifield-workspace` в службе пресетов, не здесь.

import type { Form, SlotRecipe } from "@omnifield/probe-web-skin/model";

/**
 * РАБОЧАЯ ОБЛАСТЬ. Шесть частей, состояний нет, одна ось вариаций — КАК связаны боковые колонки
 * с шапкой и подвалом, не КАКИЕ слоты показаны (это решает сборка — `assemblies.ts`, восемь
 * именованных раскладок реального рынка).
 *
 * ## Вариации — `sidebar-first` (умолчание) и `header-first`
 *
 * Обе — реальные, узнаваемые схемы, не наша выдумка:
 *
 *   • `sidebar-first` — рельсы и правая панель тянутся через ВСЮ высоту (в том числе мимо шапки
 *     и подвала), шапка и подвал стоят между ними. Ровно то же самое различие делает `AppShell`
 *     Mantine своим пропом `layout` (`"alt"` — «поставить `Navbar`/`Aside` НАД шапкой и подвалом»,
 *     `mantine.dev/core/app-shell`).
 *   • `header-first` — шапка и подвал во всю ширину СТРОКОЙ сверху и снизу, боковые колонки
 *     только в средней строке между ними. Это классический «Holy Grail Layout» (шапка+подвал на
 *     всю ширину, показ между двух колонок — `web.dev/patterns/layout/holy-grail`,
 *     `mantine.dev/core/app-shell`'s `layout="default"`).
 *
 * Обе вариации используют ОДНУ и ту же сетку строк/колонок — различаются только тем, какой слот
 * какую именованную область занимает (`gridTemplateAreas`), поэтому `gridTemplateRows`/
 * `gridTemplateColumns` остаются в базе, а не дублируются в каждой вариации.
 *
 * ## Настройка `outlined` — обводка блоков, а не фон
 *
 * Не вариация: это НЕ вопрос вкуса скина (какой скин, такая и грань), а вопрос КОНКРЕТНОЙ
 * страницы — иногда блоки различает своя подложка/контент (обводка не нужна и мешает), иногда
 * блоки одного цвета и без неё сливаются. Продукт включает её сам под конкретную сборку — тем же
 * приёмом, что у любой другой настройки, живущей в разметке, а не в имени скина. Имя — из общего
 * словаря настроек (`packages/skin/src/passport-form.ts`, `SETTINGS`), метка в разметке —
 * `data-outlined` (`../components/index.tsx`).
 */
export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "grid",
        gridTemplateColumns: "minmax(var(--space-32), var(--column-24)) 1fr minmax(0, var(--column-24))",
        gridTemplateRows: "auto 1fr auto",
        blockSize: "100%",
        minBlockSize: "0",
      },
    },
    header: { props: { gridArea: "header", minInlineSize: "0" } },
    sidebar: { props: { gridArea: "sidebar", minBlockSize: "0", overflow: "auto" } },
    main: { props: { gridArea: "main", minInlineSize: "0", minBlockSize: "0", overflow: "auto" } },
    rightbar: { props: { gridArea: "rightbar", minInlineSize: "0", minBlockSize: "0", overflow: "auto" } },
    footer: { props: { gridArea: "footer", minInlineSize: "0" } },
  },
  variants: {
    "sidebar-first": {
      root: {
        props: {
          gridTemplateAreas: '"sidebar header  rightbar" "sidebar main    rightbar" "sidebar footer  rightbar"',
        },
      },
    },
    "header-first": {
      root: {
        props: {
          gridTemplateAreas: '"header   header  header" "sidebar  main    rightbar" "footer   footer  footer"',
        },
      },
    },
  },
  defaultVariant: "sidebar-first",
  settings: {
    outlined: {
      true: {
        header: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--neutral-7)" } },
        sidebar: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--neutral-7)" } },
        main: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--neutral-7)" } },
        rightbar: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--neutral-7)" } },
        footer: { props: { borderWidth: "var(--border-width-1)", borderStyle: "solid", borderColor: "var(--neutral-7)" } },
      },
    },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "рабочая-область-проба", component: "workspace", recipe };
