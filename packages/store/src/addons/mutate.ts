import { castDraft, castImmutable, produce } from "immer";
import type { Draft } from "immer";

export type { Draft };
export { castDraft, castImmutable };

/**
 * Immer-рецепт для `setState`/`atom.set` — recipe мутирует draft, наружу уходит новое
 * иммутабельное значение, `{...state, x}` руками писать не надо. Отдельный подпуть
 * (`./mutate`) по образцу `./persist`/`./undo`/`./reset` — `immer` обычная зависимость
 * ПАКЕТА (как `@xstate/store`), приложение `immer` не ставит и не импортирует само,
 * весь нужный набор (`mutate`, `castDraft`, `castImmutable`, тип `Draft`) отдаётся отсюда.
 * Временное место в этом пакете — план перенести в другой пакет, см. ROADMAP.yaml.
 */
export function mutate<T>(recipe: (draft: Draft<T>) => void): (state: T) => T {
  return produce(recipe);
}
