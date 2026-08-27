// РАНТАЙМ-паспорт потока (`PWEB-115`, разнесено `PWEB-127`) — срез РАНТАЙМА.
//
// Состояний нет ни у одной части: раскладка не хранит ничего. Всё, что у неё есть, — адрес и
// ось вариаций, и в этом её предмет: она существует, чтобы скину было к чему прицепить правило.
//
// ЭТОТ ФАЙЛ ТОЛЬКО РАНТАЙМ — уезжает в бандл приложения. Срез РЕДАКТОРА — в `playground/index.ts`.

import { defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
// ТИП пропов — только тип: `import type` стирается сборкой, и подпуть `./passport`
// остаётся данными без Solid. Нужен, чтобы ключи настроек сверялись с настоящими пропами.
import type { FlowProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "item", states: [] }],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // Настроек из закрытого перечня ряд не принимает: направление у него — раскладочное свойство,
  // то есть ВИД, и приезжает скином (решение «раскладочные свойства это ВИД»).
  settings: defineSettings<FlowProps>({}),
});
