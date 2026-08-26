// ГРАНИЦА зон, живая (`PWEB-119`): рантайм-паспорт кита (`passportOf`) и срез редактора
// (`editorInfoOf`) — РАЗНЫЕ входы после разреза паспорта (`PWEB-115`, `PWEB-118`). До разреза
// «пара поставщика как есть» для механики была одним присваиванием — род и правило вложенности
// лежали прямо на рантайм-паспорте. После него `ReadablePassport` не собрать из одного входа:
// род и `accepts` каждой части нужно взять со среза редактора и слить с рантаймом.
//
// Слияние — здесь, а не в механике: `packages/assembly` своего правила слияния не пишет и не
// диктует (`passport-read.ts`, «чего здесь нет намеренно»). Это делает КАЖДЫЙ строитель
// реестра — продуктовый пульт, эта проба, — тем же швом, каким его собирает `products/skin`
// (см. отчёт `PWEB-119`).
//
// Только подпуть `@omnifield/probe-web-ui/passport` — данные, без Solid: пробы, которым нужен
// один паспорт (`test/passport.test.ts`), не обязаны тянуть за собой кит целиком. Пара с картой
// частей (значения-компоненты) — `kit-readable-component.ts`, отдельным файлом по той же
// причине, по которой у самой механики `./model` разведён с `.`.

import { editorInfoOf, passportOf } from "@omnifield/probe-web-ui/passport";

import type { ReadablePassport } from "../src/passport-read.js";

/**
 * Паспорт кита, слитый со срезом редактора, — форма, которую механика читает как
 * `ReadablePassport`.
 *
 * @param component имя компонента кита
 */
export function readablePassportOf(component: string): ReadablePassport {
  const passport = passportOf(component);
  const editorInfo = editorInfoOf(component);
  if (!passport || !editorInfo) {
    throw new Error(`кит не отдаёт «${component}» целиком (паспорт и срез редактора)`);
  }

  return {
    ...passport,
    genus: editorInfo.genus,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
  };
}
