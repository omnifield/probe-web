// НАДЕТОЕ — общее состояние (имя наряда + половина), а не приватное поле `SkinSwitcher`.
//
// Витрине (`pages/_workspace/showcase`) нужно знать, какой наряд надет, чтобы взять имена
// вариаций формы ЭТОГО наряда (`variantsOf`, `./index.js`) — до сих пор это состояние было
// закрыто внутри `createWearingState()` (`widgets/skin-switcher/model.ts`), и витрина зашивала
// список вариантов кнопки литералом (находка PWEB-174, не решена вовремя — решается здесь).

import type { SkinWorn } from "@omnifield/probe-web-runtime";
import { createSignal } from "solid-js";

export const [wornSkin, setWornSkin] = createSignal<SkinWorn | null>(null);
