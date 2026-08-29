// МОСТ К ЧАСТЯМ КИТА, ЕЩЁ НЕ ДОЕХАВШИМ ДО КОРНЯ ПАКЕТА (`PWEB-161`).
//
// `field`/`select`/`switch`/`segment-group`/`radio-group` уже настоящие — паспорт, анатомия,
// собственный наряд (`omnifield-field` и другие формы реально в службе пресетов), — но именованный
// экспорт корня `@omnifield/probe-web-ui` (`packages/ui/src/index.ts`) их ещё не назвал: миграция
// компонентов на Ark идёт компонент за компонентом (`packages/ui/src/index.ts`, строки на `.jsx`
// против `/index.js`), и это не наша зона.
//
// Пульту они нужны СЕЙЧАС — панель настроек и хедер должны одеваться тем же нарядом, что и
// показанные продукты (постановка user, «скин пульта такой же, как у продуктов»), — а не после
// того, как миграция дойдёт до них своим чередом. `KIT`/`kitOf` УЖЕ на корне (`packages/ui/src/
// kit.ts` экспортирует их, и авто-генератор кита уже включает все пять): читаем часть оттуда же,
// откуда её читает сама витрина для показа случаев, — тем же путём, никакого обхода паспорта.
//
// Точных типов пропов у некормленных компонентов отсюда не достать: `KitComponent.parts`
// намеренно широк (`(...args: never[]) => unknown`, `packages/ui/src/kit-form.ts`) — сама форма
// кита обобщена по элементу. Приведение типа здесь — не подмена проверки, а перечисление того,
// что уже подтверждено чтением настоящего компонента (`field/components/index.tsx` и т. д.) и
// документацией Ark (`ark-ui.com`).

import { kitOf } from "@omnifield/probe-web-ui";
import type { Component } from "solid-js";

/** Часть компонента кита по имени, приведённая к пропам, которые она реально принимает. */
export function partOf<P extends object>(component: string, part: string): Component<P> {
  const found = kitOf(component)?.parts[part];
  if (!found) throw new Error(`в ките нет части «${part}» у «${component}» — миграция ещё не доехала`);
  return found as unknown as Component<P>;
}

/**
 * Вспомогательный компонент кита БЕЗ адреса анатомии (`extras`, `PWEB-152`) — скрытый `<input>`
 * чекбокса/свитча и подобные: реальный узел, на котором висит настоящий `onChange`, но которого
 * Ark никогда не адресует. Без него превью выглядит верно, а клик ничего не переключает — тот
 * же урок, что и у сборок через `RenderTree`, просто здесь его платит прямая JSX-композиция.
 */
export function extraOf<P extends object>(component: string, extra: string): Component<P> {
  const found = kitOf(component)?.extras?.[extra];
  if (!found) throw new Error(`в ките нет вспомогательного узла «${extra}» у «${component}»`);
  return found as unknown as Component<P>;
}
