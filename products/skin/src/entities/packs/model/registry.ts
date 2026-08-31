// РЕЕСТР ЗАГОТОВОК ВИТРИНЫ — тем же приёмом, что `entities/component/model/registry.ts`: механизм
// (`createPackRegistry`) берётся из `packages/io`, наполнение — продуктовое.

import { createPackRegistry } from "@omnifield/probe-web-io";

import { BUILTIN_PACKS } from "./content.js";

export const PACKS = createPackRegistry();

for (const [theme, items] of Object.entries(BUILTIN_PACKS)) {
  PACKS.register(theme, items);
}
