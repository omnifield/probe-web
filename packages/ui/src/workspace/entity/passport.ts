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
import type { WorkspaceProps } from "../components/index.jsx";
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
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // Настроек из закрытого перечня рабочая область не принимает — тем же доводом, что у сетки:
  // сколько места и что схлопывается — раскладочное свойство, то есть ВИД, и приезжает скином.
  settings: defineSettings<WorkspaceProps>({}),
});
