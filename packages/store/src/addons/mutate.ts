import { produce } from "immer";
import type { Draft } from "immer";

/**
 * Immer-рецепт для `setState`/`atom.set` — recipe мутирует draft, наружу уходит новое
 * иммутабельное значение, `{...state, x}` руками писать не надо. Отдельный подпуть
 * (`./mutate`), `immer` — опциональный peer, не тянется в бандл, пока не импортирован.
 * Временное место в этом пакете — план перенести в другой пакет, см. ROADMAP.yaml.
 */
export function mutate<T>(recipe: (draft: Draft<T>) => void): (state: T) => T {
  return produce(recipe);
}
