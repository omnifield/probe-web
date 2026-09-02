import {
  createContext,
  createMemo,
  splitProps,
  useContext,
  type Accessor,
} from "solid-js";
import {
  createTreeCollection,
  TreeViewRoot as ArkRoot,
  TreeViewTree as ArkTree,
  type TreeViewRootProps as ArkRootProps,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import type { TreeItem } from "../entity/io.js";

export interface TreeRootProps extends Omit<
  ArkRootProps<TreeItem>,
  "collection"
> {
  /**
   * Данные дерева — та же форма, что и io-схема компонента (`entity/io.ts`, `Data.items`), для
   * ЛЮБОГО потребителя этого кита она одна и та же. `TreeRoot` сам строит из них `TreeCollection`
   * (Zag-примитив `createTreeCollection`, `nodeToValue`/`nodeToString` по id/label) — снаружи
   * пакета вызывать этот примитив не нужно вовсе, это внутреннее дело корня.
   */
  readonly items: readonly TreeItem[];

  /**
   * Id узла, подсвеченного СНАРУЖИ — не кликом/`selectedValue` Zag, а напрямую. Задан — подсветка
   * решается ТОЛЬКО сравнением с этим id, свой клик по строке (родной `selectNode` у Zag) её
   * больше не трогает. Не задан — работает родное поведение Zag как есть, ничего не переопределено.
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
 * сравнением id, независимо от того, что сейчас думает про выбор сам Zag.
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
  traceLife("ui.tree-view");

  const [local, rest] = splitProps(props, ["children", "activeValue", "items"]);

  const collection = createMemo(() =>
    createTreeCollection<TreeItem>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.label,
      rootNode: { id: "ROOT", label: "", children: local.items },
    }),
  );

  return (
    <TreeActiveContext.Provider value={() => local.activeValue}>
      <ArkRoot {...dropAddress(rest)} collection={collection()}>
        <ArkTree>{local.children}</ArkTree>
      </ArkRoot>
    </TreeActiveContext.Provider>
  );
}
