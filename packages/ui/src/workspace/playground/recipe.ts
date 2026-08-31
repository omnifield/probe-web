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
 * ## Вариации — `sidebar-first` (умолчание), `header-first`, `header-full`
 *
 * Первые две — реальные, узнаваемые схемы, не наша выдумка:
 *
 *   • `sidebar-first` — рельсы и правая панель тянутся через ВСЮ высоту (в том числе мимо шапки
 *     и подвала), шапка и подвал стоят между ними. Ровно то же самое различие делает `AppShell`
 *     Mantine своим пропом `layout` (`"alt"` — «поставить `Navbar`/`Aside` НАД шапкой и подвалом»,
 *     `mantine.dev/core/app-shell`).
 *   • `header-first` — шапка и подвал во всю ширину СТРОКОЙ сверху и снизу, боковые колонки
 *     только в средней строке между ними. Это классический «Holy Grail Layout» (шапка+подвал на
 *     всю ширину, показ между двух колонок — `web.dev/patterns/layout/holy-grail`,
 *     `mantine.dev/core/app-shell`'s `layout="default"`).
 *   • `header-full` — ТРЕТЬЯ, гибридная точка того же пространства (постановка user, 2026-08-29):
 *     шапка во всю ширину, как у `header-first`, но подвал — НЕ на всю ширину, а только под
 *     показом, между рельсами и правой панелью, которые ради этого тянутся мимо него (как у
 *     `sidebar-first`, но не мимо шапки). Своей рыночной цитаты у этой комбинации нет — она
 *     складывается из тех же примитивов, что и первые две, названа честно, без притязания на
 *     чужое имя.
 *
 * Все три вариации используют ОДНУ и ту же сетку строк/колонок — различаются только тем, какой
 * слот какую именованную область занимает (`gridTemplateAreas`), поэтому `gridTemplateRows`/
 * `gridTemplateColumns` остаются в базе, а не дублируются в каждой вариации.
 *
 * ## Настройка `outlined` — ШОВ, а не бордер на каждом слоте (уточнено 2026-08-29)
 *
 * Не вариация: это НЕ вопрос вкуса скина (какой скин, такая и грань), а вопрос КОНКРЕТНОЙ
 * страницы — иногда блоки различает своя подложка/контент (шов не нужен и мешает), иногда блоки
 * одного цвета и без него сливаются. Продукт включает её сам под конкретную сборку — тем же
 * приёмом, что у любой другой настройки, живущей в разметке, а не в имени скина. Имя — из общего
 * словаря настроек (`packages/skin/src/passport-form.ts`, `SETTINGS`), метка в разметке —
 * `data-outlined` (`../components/index.tsx`).
 *
 * **Не `border` на каждом слоте.** Пять независимых рамок на пяти соседних узлах на СТЫКЕ дают
 * двойную линию (1px соседа + 1px соседа), а в точке, где сходятся три-четыре слота — нахлёст
 * нескольких отрезков вместо прямого угла: рабочая область перестаёт читаться как единое полотно
 * с ровными ячейками, ровно та находка, из-за которой этот раздел переписан.
 *
 * **Взамен — зазор сетки плюс свой фон у каждой ячейки.** `gap` на `root` — это и есть шов: одна
 * закраска корня, проступающая сквозь зазор МЕЖДУ дорожками сетки, везде одной толщины и без
 * дублирования, потому что это не пересечение отрезков, а один слой фона. Угол, где сходятся
 * несколько ячеек, автоматически прямой — там просто прямоугольник фона, а не место встречи
 * нескольких линий. Слот поверх шва кладёт СВОЙ фон — иначе то, что он должен выделить (блок без
 * подложки), останется прозрачным и сольётся со швом же.
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
    "header-full": {
      root: {
        props: {
          gridTemplateAreas: '"header   header  header" "sidebar  main    rightbar" "sidebar  footer  rightbar"',
        },
      },
    },
  },
  defaultVariant: "sidebar-first",
  settings: {
    outlined: {
      // Толщина шва берётся у шкалы толщины рамки (`--border-width-1`), не у интервалов: это
      // хайрлайн-линия, а не отступ, и им она остаётся семантически, просто заняв роль зазора.
      true: {
        root: { props: { gap: "var(--border-width-1)", backgroundColor: "var(--neutral-6)" } },
        header: { props: { backgroundColor: "var(--neutral-2)" } },
        sidebar: { props: { backgroundColor: "var(--neutral-2)" } },
        main: { props: { backgroundColor: "var(--neutral-2)" } },
        rightbar: { props: { backgroundColor: "var(--neutral-2)" } },
        footer: { props: { backgroundColor: "var(--neutral-2)" } },
      },
    },
  },
};

/** Форма — запись «имя формы + компонент + рецепт», та же, что примет `assemble`. */
export const form: Form = { name: "рабочая-область-проба", component: "workspace", recipe };
