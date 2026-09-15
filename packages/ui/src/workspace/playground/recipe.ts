import type { Form, SlotRecipe } from "@web-core/skin/model";

export const recipe: SlotRecipe = {
  base: {
    root: {
      props: {
        display: "grid",
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
          gridTemplateColumns: "minmax(var(--rail-sm), max-content) 1fr minmax(var(--rail-sm), max-content)",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateAreas: '"sidebar header  rightbar" "sidebar main    rightbar" "sidebar footer  rightbar"',
        },
      },
    },
    "header-first": {
      root: {
        props: {
          gridTemplateColumns: "minmax(var(--rail-sm), max-content) 1fr minmax(var(--rail-sm), max-content)",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateAreas: '"header   header  header" "sidebar  main    rightbar" "footer   footer  footer"',
        },
      },
    },
    "header-full": {
      root: {
        props: {
          gridTemplateColumns: "minmax(var(--rail-sm), max-content) 1fr minmax(var(--rail-sm), max-content)",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateAreas: '"header   header  header" "sidebar  main    rightbar" "sidebar  footer  rightbar"',
        },
      },
    },
    stacked: {
      root: {
        props: {
          gridTemplateColumns: "1fr",
          gridTemplateRows: "auto 1fr",
          gridTemplateAreas: '"header" "main"',
        },
      },
    },
    "multi-column": {
      root: {
        props: {
          gridTemplateColumns: "minmax(var(--rail-sm), max-content) 1fr minmax(var(--rail-sm), max-content)",
          gridTemplateRows: "1fr",
          gridTemplateAreas: '"sidebar main rightbar"',
        },
      },
    },
  },
  defaultVariant: "sidebar-first",
  settings: {
    outlined: {
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

export const form: Form = { name: "рабочая-область-проба", component: "workspace", recipe };
