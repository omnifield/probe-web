import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type WorkspacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<WorkspacePart, PassportPartEditorInfo<WorkspacePart>>> = {
  root: {
    means: "каркас приложения целиком — держит все именованные слоты в одной сетке",
    accepts: [
      { kind: "component", name: "header" },
      { kind: "component", name: "sidebar" },
      { kind: "component", name: "main" },
      { kind: "component", name: "rightbar" },
      { kind: "component", name: "footer" },
    ],
  },
  header: {
    means: "верхняя полоса — не на всю высоту, только над показом и правой панелью",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  sidebar: {
    means: "левая колонка — во всю высоту, рядом и с шапкой, и с показом",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  main: {
    means: "показ — единственный слот, который есть всегда",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  rightbar: {
    means: "правая колонка — необязательна; не положена в сборку, колонка схлопывается сама",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  footer: {
    means: "нижняя полоса — необязательна; не положена в сборку, строка схлопывается сама",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
