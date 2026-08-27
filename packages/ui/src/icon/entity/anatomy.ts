// РАНТАЙМ-анатомия значка (`PWEB-107`, разнесено `PWEB-127`).
//
// ЗДЕСЬ ТОЛЬКО ЧАСТИ И АДРЕСА — ничего больше, тем же приёмом, что у гармошки
// (`accordion/entity/anatomy.ts`). Полный рантайм-контракт — уровнем выше, в `passport.ts`.
// Срез РЕДАКТОРА — ещё шагом дальше, в `playground/index.ts`.

import { createAnatomy } from "@omnifield/probe-web-skin/model";

/** Части значка. Она одна: значок — это один узел `<svg>`, которым рисует `lucide-solid`. */
export const anatomy = createAnatomy("icon").parts("root");

/** Адреса частей: `attrs` для узла, `selector` для стиля. Считаются один раз — они статичны. */
export const anatomyParts = anatomy.build();
