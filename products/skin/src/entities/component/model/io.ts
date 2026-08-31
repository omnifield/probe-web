// РЕЕСТР ПАСПОРТОВ ФОРМЫ ВИТРИНЫ — механизм из `packages/io` (`createIoRegistry`, PWEB-181),
// наполнение — автоматически из кита (`@omnifield/probe-web-ui/io`, PWEB-180 продолжение,
// 2026-08-30, находка user): компонент, объявивший `entity/io.ts`, попадает сюда самим фактом
// объявления, продукт больше НЕ регистрирует каждый компонент отдельной ручной строкой — тем
// же приёмом, каким `PASSPORTS`/`KIT` уже давно не ведутся руками.
//
// Компонент без паспорта формы просто не участвует в подборе заготовок (`DataInput` проверяет
// `IO.get(...)`, не `require`) — это честное «пока нечем», не отказ.

import { createIoRegistry } from "@omnifield/probe-web-io";
import { IO as KIT_IO } from "@omnifield/probe-web-ui/io";

export const IO = createIoRegistry();

for (const [component, io] of Object.entries(KIT_IO)) {
  // Направление снимается с того, что компонент реально объявил — не домысливаем "io" там, где
  // выхода нет: `IoDirection` дальше сможет на это опереться, когда дойдёт до дела.
  if (io.input) IO.register(component, io.input, io.output ? "io" : "input");
}
