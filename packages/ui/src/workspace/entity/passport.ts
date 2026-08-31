// РАНТАЙМ-паспорт рабочей области (`PWEB-154`) — срез РАНТАЙМА.
//
// Состояний нет, как у сетки и потока: раскладка ничего не хранит. Какая колонка сколько весит и
// схлопывается ли отсутствующая боковая панель — это ВИД, и живёт в правиле скина, а не в
// паспорте и не в разметке.
//
// ЭТОТ ФАЙЛ ТОЛЬКО РАНТАЙМ — уезжает в бандл приложения. Срез РЕДАКТОРА — в `playground/index.ts`.

import { defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
// ТИП пропов — только тип: `import type` стирается сборкой, и подпуть `./passport`
// остаётся данными без Solid. Нужен, чтобы ключи настроек сверялись с настоящими пропами.
import type { WorkspaceProps } from "../components/index.js";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "header", states: [] },
    { name: "sidebar", states: [] },
    { name: "main", states: [] },
    { name: "rightbar", states: [] },
    { name: "footer", states: [] },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // ЕДИНСТВЕННАЯ настройка — `outlined` (общий словарь, `packages/skin/src/passport-form.ts`,
  // `SETTINGS`), и она не поведенческая (тем же доводом, что и раньше про раскладку: сколько
  // весит колонка — вид, а не проп). Но КАКИМ ИМЕННО видом разделять блоки — обводкой или
  // собственным фоном/контентом каждого — решает продукт на конкретной странице, а не скин один
  // раз на все страницы: один и тот же скин ставит панель управления с рамками и витрину без
  // них. Метка — `data-outlined`: `Workspace` её не переводит, атрибут долетает до DOM как есть
  // (`Polymorphic` спредит любой `data-*` без разбора), тем же приёмом, что у `data-variant`.
  settings: defineSettings<WorkspaceProps>()({
    outlined: {
      values: { kind: "flag" },
      byDefault: false,
      mark: { kind: "attribute", name: "data-outlined" },
    },
  }),
});
