// Срез РЕДАКТОРА потока (`PWEB-115`, `PWEB-118`, разнесено `PWEB-127`) — назначения человеку,
// род, группа, вложенность, сборка. Никогда не для рантайма приложения — тот стоит на
// `../entity/passport.ts`, который отсюда не читается ни разу.
//
// ТОНКИЙ нарочно: таксономия (`parts.ts`) и сценарий (`assemblies.ts`) — в своих файлах, та же
// физическая форма, что и у остальных компонентов `playground/`.

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  group: "layout",
  footprint: "regular",
  variantAxis: {
    means: "имя вариации потока; его даёт человек в редакторе, кит пропускает насквозь",
  },
  parts,
  assemblies,
});
