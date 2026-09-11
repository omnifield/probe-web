import {
  createContext,
  createMemo,
  splitProps,
  useContext,
  type Accessor,
} from "solid-js";
import {
  TreeViewRoot as ArkRoot,
  TreeViewTree as ArkTree,
  type TreeViewRootProps as ArkRootProps,
} from "@ark-ui/solid/tree-view";

import type { Item } from "../../shared/data/fields.js";
import { createItemTreeCollection } from "../../shared/utils/collection.js";
import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";

export interface TreeRootProps extends Omit<
  ArkRootProps<Item>,
  "collection"
> {
  /**
   * Данные дерева — тот же канонический `item` (`shared/data/fields.ts`), что и io-схема
   * компонента (`entity/io.ts`, `Data.items`), для ЛЮБОГО потребителя этого кита она одна и та
   * же. `TreeRoot` сам строит из них `TreeCollection` через `createItemTreeCollection`
   * (`nodeToValue`/`nodeToString` по value/label) — снаружи пакета вызывать примитивы Zag не
   * нужно вовсе, это внутреннее дело корня.
   */
  readonly items: readonly Item[];

  /**
   * Value узла, подсвеченного СНАРУЖИ — не кликом/`selectedValue` Zag, а напрямую. Задан —
   * подсветка решается ТОЛЬКО сравнением с этим value, свой клик по строке (родной `selectNode`
   * у Zag) её больше не трогает. Не задан — работает родное поведение Zag как есть, ничего не
   * переопределено.
   */
  readonly activeValue?: string;
}

const TreeActiveContext = createContext<Accessor<string | undefined>>(
  () => undefined,
);

/** Читают части узла (`item`/`control`/`controlIndicator`) — каждая сама вычисляет свой
 * `data-selected`, поэтому переопределять нужно во всех трёх, не только в одном месте. */
export function useTreeActiveValue() {
  return useContext(TreeActiveContext);
}

/**
 * Переопределение `data-selected` для одной части узла. `activeValue` не задан — пустой объект,
 * спред ничего не трогает, родной атрибут Zag остаётся как есть. Задан — атрибут целиком решается
 * сравнением value, независимо от того, что сейчас думает про выбор сам Zag.
 *
 * `null`, а не `undefined` — у Solid `mergeProps` при `undefined` в более позднем источнике
 * пропускает его и берёт значение из более раннего (родного, от Zag), так что "снять подсветку"
 * тут возможно только явным определённым значением, а не отсутствием ключа.
 */
export function activeOverride(
  activeValue: string | undefined,
  ownValue: string,
): Readonly<Record<string, unknown>> {
  return activeValue === undefined
    ? {}
    : { "data-selected": ownValue === activeValue ? "" : null };
}

export function TreeRoot(props: TreeRootProps) {
  useKitLife(passport, props);

  const [local, rest] = splitProps(props, ["children", "activeValue", "items"]);

  const collection = createMemo(() => createItemTreeCollection(local.items));

  const activeValue = createMemo(() => local.activeValue);

  return (
    <TreeActiveContext.Provider value={activeValue}>
      <ArkRoot {...dropAddress(rest)} collection={collection()}>
        <ArkTree>{local.children}</ArkTree>
      </ArkRoot>
    </TreeActiveContext.Provider>
  );
}
