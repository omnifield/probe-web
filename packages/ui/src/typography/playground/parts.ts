import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type TypographyPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<TypographyPart, PassportPartEditorInfo<TypographyPart>>> = {
  root: {
    means: "текст с настроенным видом — тег и внешний вид выбираются независимо друг от друга",
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "component" },
    ],
  },
};
