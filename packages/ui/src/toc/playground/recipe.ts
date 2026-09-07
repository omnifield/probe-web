import type { Form, SlotRecipe } from "@web-core/skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: { display: "block", position: "relative" },
    },
    content: {
      // Чистая обёртка вокруг настоящего контента потребителя — `display: contents` не участвует
      // в раскладке сама, ничего не решает за то, что реально лежит внутри (то же правило, что у
      // `content`-подобных частей вообще, см. packages/ui/README.md про части-контейнеры).
      props: { display: "contents" },
    },
    nav: {
      props: { display: "flex", flexDirection: "column", flexShrink: "0", width: "240px" },
    },
    title: {
      props: {
        margin: "0 0 var(--space-2) 0",
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--weight-medium)",
        color: "var(--neutral-11)",
      },
    },
    list: {
      props: { position: "relative", display: "flex", flexDirection: "column", gap: "var(--space-1)" },
    },
    indicator: {
      props: {
        position: "absolute",
        background: "var(--accent-3)",
        borderRadius: "var(--radius-md)",
        transition: "top var(--motion-normal) var(--ease-out), height var(--motion-normal) var(--ease-out)",
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
      // `--left`/`--top`/`--width`/`--height` — переменные `root` (машина Zag измеряет и пишет
      // их туда, не на сам `indicator`), а не собственные переменные этой части — обычное
      // CSS-наследование сверху вниз донесло бы их само, но проверка скина этого на веру не
      // берёт, поэтому предок назван явно (см. packages/ui/README.md про переменные не своих частей).
      ancestors: [
        {
          component: "toc",
          part: "root",
          style: {
            props: {
              left: "var(--left)",
              top: "var(--top)",
              width: "var(--width)",
              height: "var(--height)",
            },
          },
        },
      ],
    },
    item: {
      props: { paddingInlineStart: "calc((var(--depth) - 2) * var(--space-3))" },
      states: {
        active: { props: { background: "var(--accent-2)", borderRadius: "var(--radius-md)" } },
        // Отступ от края скролл-контейнера при автоскролле к первому/последнему видимому пункту
        // (`autoScroll` у root) — не декоративный отступ, а буфер, чтобы пункт не прилипал к краю.
        first: { props: { scrollMarginBlockStart: "var(--space-2)" } },
        last: { props: { scrollMarginBlockEnd: "var(--space-2)" } },
      },
    },
    link: {
      props: {
        position: "relative",
        zIndex: "1",
        display: "block",
        paddingBlock: "var(--space-1)",
        paddingInline: "var(--space-2)",
        borderRadius: "var(--radius-md)",
        color: "var(--neutral-11)",
        fontSize: "var(--font-size-sm)",
        textDecoration: "none",
      },
      states: {
        active: { props: { color: "var(--accent-11)", fontWeight: "var(--weight-medium)" } },
      },
    },
  },
};

export const form: Form = { name: "toc-sample", component: "toc", recipe };
