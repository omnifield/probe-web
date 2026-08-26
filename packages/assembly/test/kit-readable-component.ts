// Пара поставщика (паспорт + части) для проб, которым нужен живой узел, а не только паспорт —
// разбор шва в `kit-readable.ts`. `kitOf` тянет кит целиком, включая Solid-компоненты, поэтому
// файл отдельный: пробы одного паспорта (`test/passport.test.ts`) его не импортируют.

import { kitOf } from "@omnifield/probe-web-ui";

import type { ReadableComponent } from "../src/registry.js";
import { readablePassportOf } from "./kit-readable.js";

/**
 * Пара поставщика для реестра (паспорт + части), слитая тем же швом.
 *
 * @param component имя компонента кита
 */
export function readableKitComponent(component: string): ReadableComponent {
  const kit = kitOf(component);
  if (!kit) throw new Error(`кит не отдаёт компонента «${component}»`);

  return { passport: readablePassportOf(component), parts: kit.parts };
}
