// Срез РЕДАКТОРА поверхности (`PWEB-115`, `PWEB-118`, разнесено `PWEB-127`) — назначения
// человеку, род, группа, вложенность, рабочий экземпляр. Никогда не для рантайма приложения —
// тот стоит на `../entity/passport.ts`, который отсюда не читается ни разу.
//
// ТОНКИЙ нарочно: таксономия (`parts.ts`) и сценарий (`assemblies.ts`) — в своих файлах, та же
// физическая форма, что и у остальных компонентов `playground/`.
//
// `/*@__PURE__*/` перед вызовом позволяет бандлеру выбросить его целиком у потребителя, который
// на `editorInfo` не сослался ни разу, — тем же способом, которым выбрасывается неиспользуемый
// экспорт (разбор — в шапке `@omnifield/probe-web-skin/passport-editor.ts`).

import { defineEditorInfo } from "@omnifield/probe-web-skin/editor";
import { passport } from "../entity/passport.js";
import { assemblies } from "./assemblies.js";
import { parts } from "./parts.js";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@omnifield/probe-web-ui",
  genus: "component",
  // Место в перечне: то, что делит и держит место.
  group: "layout",
  footprint: "regular",
  variantAxis: {
    // Ось здесь несёт ВЕСЬ вид компонента: «карточка», «панель», «утопленная» — это имена,
    // которые человек даёт в редакторе, а кит пропускает насквозь. Своих имён у кита нет и
    // быть не может — иначе он объявил бы вид, которого не умеет проверить.
    means: "имя вариации поверхности; его даёт человек в редакторе, кит пропускает насквозь",
  },
  parts,
  assemblies,
});
