import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type FlowPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<FlowPart, PassportPartEditorInfo<FlowPart>>> = {
  root: {
    means: "поток — элементы идут друг за другом по одной оси; какой именно, говорит скин",
    accepts: [
      { kind: "component", name: "item" },
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
  item: {
    means: "место одного элемента в потоке — им адресуется «этот тянется, остальные по содержимому»",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
