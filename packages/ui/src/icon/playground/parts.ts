import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type IconPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<IconPart, PassportPartEditorInfo<IconPart>>> = {
  root: {
    means: "сама иконка — один узел, вид какой именно решает `name`, размер и цвет — рецепт",
    accepts: [],
  },
};
