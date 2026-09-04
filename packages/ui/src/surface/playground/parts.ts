import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type SurfacePart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<SurfacePart, PassportPartEditorInfo<SurfacePart>>> = {
  root: {
    means: "плоскость — фон, рамка, тень и скругление отделяют содержимое от того, что под ним",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
