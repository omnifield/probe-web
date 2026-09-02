import type { PassportPartEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { passport } from "../entity/passport.js";

type AvatarPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

const visibleHiddenMeans = {
  visible: { means: "эта часть сейчас показана" },
  hidden: { means: "другая часть — image и fallback никогда не бывают показаны или скрыты одновременно" },
} satisfies PassportPartEditorInfo<AvatarPart>["states"];

export const parts: Readonly<Record<AvatarPart, PassportPartEditorInfo<AvatarPart>>> = {
  root: {
    means: "аватар целиком — оборачивает картинку и её заглушку",
    states: {},
    accepts: [
      { kind: "component", name: "image" },
      { kind: "component", name: "fallback" },
    ],
  },
  image: {
    means: "картинка — настоящий `<img>`, остаётся в разметке даже скрытым, чтобы его load/error всё равно сработали",
    states: visibleHiddenMeans,
    accepts: [],
  },
  fallback: {
    means: "показывается, пока картинка не загрузилась (или её нет) — инициалы, иконка, что положит потребитель",
    states: visibleHiddenMeans,
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
};
