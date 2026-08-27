// Срез РЕДАКТОРА рабочей области (`PWEB-154`) — назначения человеку, род, группа, вложенность,
// сборка. Никогда не для рантайма приложения — тот стоит на `../entity/passport.ts`, который
// отсюда не читается ни разу.
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
  // Каркас приложения по природе претендует на весь экран — тем же доводом, что у таблицы и
  // карусели (`packages/skin/src/passport-editor.ts`, `ComponentFootprint`).
  footprint: "wide",
  variantAxis: {
    means: "имя вариации раскладки; его даёт человек в редакторе, кит пропускает насквозь",
  },
  parts,
  assemblies,
});
