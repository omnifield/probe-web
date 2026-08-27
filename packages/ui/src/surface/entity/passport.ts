// РАНТАЙМ-паспорт поверхности (`PWEB-115`, разнесено `PWEB-127`) — срез РАНТАЙМА.
//
// Словарь состояний ПУСТ, и это утверждение, а не заглушка: поверхность не хранит ничего, чем
// её вид мог бы отличаться. Наведение и фокус принадлежат тому, что лежит ВНУТРИ неё, — кнопке,
// ссылке, полю; объяви мы их здесь, скин получил бы правила, которые никогда не сработают.
//
// ЭТОТ ФАЙЛ ТОЛЬКО РАНТАЙМ — уезжает в бандл приложения. Срез РЕДАКТОРА — в `playground/index.ts`.

import { defineSettings, definePassport } from "@omnifield/probe-web-skin/model";
// ТИП пропов — только тип: `import type` стирается сборкой, и подпуть `./passport`
// остаётся данными без Solid. Нужен, чтобы ключи настроек сверялись с настоящими пропами.
import type { SurfaceProps } from "../components/index.jsx";
import { anatomy } from "./anatomy.js";

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  // Настроек из закрытого перечня поверхность не принимает.
  settings: defineSettings<SurfaceProps>({}),
});
