import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type GridPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<GridPart, PassportPartEditorInfo<GridPart>>> = {
  root: {
    means: "сетка — общие дорожки, по которым элементы выравниваются и поперёк строк",
    accepts: [
      { kind: "component", name: "cell" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  cell: {
    means: "место одного элемента в сетке — им адресуется «этот занимает две колонки»",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
