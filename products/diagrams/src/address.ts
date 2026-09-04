// АДРЕСНЫЕ атрибуты — та же пара, что несёт `@zag-js/anatomy` и что `packages/ui/src/address.ts`
// уже называет для кита: `data-scope` — имя компонента, `data-part` — имя части.
//
// Своя копия, не импорт из `@web-core/ui`: то был бы внутренний файл чужого пакета,
// не объявленный в его `exports` — граница пакета, а не лень (тот же урок, что `workspace:*`
// вместо `file:`, `pnpm-workspace.yaml`). Копия честная: ДВЕ строки, весь файл виден целиком.
//
// БЕЗ цепочки зацепок `as={…}` (`packages/ui/src/slot-chain.ts`, `slotAware`/`useSlot`): этот
// продукт не строит полиморфные примитивы поверх Ark/Kobalte — компоненты `diagrams` рисуют
// фиксированный тег (`<svg>`, `<g>`) сами, и составлять их через чужой `as` было бы нечем.
// Нужен только один приём оттуда — «адрес пришедший снаружи отбрасывается, ставит его тот, кто
// рисует узел, и ставит последним» (`PWEB-46`).

import { splitProps } from "solid-js";

export const SCOPE = "data-scope";
export const PART = "data-part";

const ADDRESS = [SCOPE, PART] as const;

/**
 * Снимает с пропов ЧУЖОЙ адрес — ровно пару адресных атрибутов, и больше ничего.
 *
 * `splitProps`, не ручное разрушение (`const {...} = props`): последнее прочло бы каждое поле
 * ОДИН раз при вызове и заморозило его — тот же промах, что `packages/ui/src/table` уже назвал
 * своим файловым заголовком для `TableRoot`.
 *
 * @param props пропы примитива
 */
export function dropAddress<P extends object>(props: P): P {
  const [, rest] = splitProps(props as P & Record<(typeof ADDRESS)[number], unknown>, [...ADDRESS]);

  return rest as P;
}
