import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<DiagramPart, PassportPartEditorInfo<DiagramPart>>> = {
  root: {
    means: "TODO",
    states: {},
    accepts: [
      { kind: "component", name: "axis" },
      { kind: "component", name: "grid" },
    ],
  },
  axis: {
    means: "TODO",
    states: {
      x: { means: "TODO" },
      y: { means: "TODO" },
    },
    accepts: [],
  },
  grid: {
    means: "TODO",
    states: {
      x: { means: "TODO" },
      y: { means: "TODO" },
    },
    accepts: [],
  },
};
