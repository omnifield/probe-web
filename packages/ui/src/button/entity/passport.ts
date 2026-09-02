import {
  defineSettings,
  definePassport,
} from "@omnifield/probe-web-skin/model";
import type { ButtonProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    {
      name: "root",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        {
          name: "focus-visible",
          mark: { kind: "pseudo", name: ":focus-visible" },
        },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
        {
          name: "disabled",
          mark: { kind: "attribute", name: "data-disabled" },
        },
        {
          name: "busy",
          mark: { kind: "attribute", name: "aria-busy", value: "true" },
        },
        {
          name: "expanded",
          mark: { kind: "attribute", name: "data-expanded" },
        },
        { name: "pressed", mark: { kind: "attribute", name: "data-pressed" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<ButtonProps>()({}),
  selfAssembly: {
    tree: {
      node: "root",
      bind: { "data-variant": "/data-variant" },
      on: {
        click: {
          event: { name: "select", context: { payload: { path: "/payload" } } },
        },
      },
      children: [{ genus: "text", value: { path: "/label" } }],
    },
  },
});
