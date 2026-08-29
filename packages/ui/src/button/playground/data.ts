// ЗАГОТОВЛЕННЫЕ ВАРИАНТЫ ЗАПОЛНЕНИЯ — под сборку `filled` (`PWEB-156`). Поставляет их кит, не
// витрина — тем же доводом, что у `../../accordion/playground/data.ts`.

import type { DataPreset } from "@omnifield/probe-web-skin/editor";

export const dataPresets: readonly DataPreset[] = [
  { name: "короткая", means: "короткая подпись — обычный случай", data: { label: "Сохранить" } },
  {
    name: "длинная",
    means: "длинная подпись — проверка, что кнопка не рвётся посередине слова",
    data: { label: "Подтвердить и отправить заявку на рассмотрение" },
  },
  {
    name: "с пейлоадом",
    means: "под сборку «with-event» — подпись и то, что клик отдаст наружу как есть",
    data: { label: "Открыть", payload: "accordion" },
  },
];
