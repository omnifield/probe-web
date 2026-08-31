// ВЫХОД — виджет (FSD, парный к `widgets/data-input`, постановка user, 2026-08-30). Место в
// подвале воркспейса (`pages/_workspace/index.tsx`), где показывается то, что происходит по
// ходу показа.
//
// «События» — ЖИВЫЕ (постановка user, 2026-08-30): последнее событие, отданное показанным
// компонентом (`ComponentPreview`'s `dispatch` → `previewStore`), читается отсюда через
// `usePreviewLastEvent()`. Пока ОДИН объект — новое перезаписывает предыдущее, истории ещё нет
// (заявлено самим user как следующий заход, не забыто). «Файлы скина» — ВСЁ ЕЩЁ МОК: тот
// источник (сохранённые записи службы пресетов) не подключён этим заходом, и вид «под JSON»
// (заявка «стилизуем позже») — тоже отдельно.
//
// Показ — настоящий `TreeView` кита (`packages/ui/src/tree-view`), не самодельный список: узел
// раскрывается/схлопывается, у листа и ветки — родная разметка Ark. `TreeView` рисуется как
// ОБЫЧНЫЙ JSX компонента, не через `RenderTree`/сборку — `tree-view/playground/assemblies.ts`
// сборку для него НАРОЧНО не заводит (комментарий там же: каждая частичная нода читает контекст
// настоящей `@zag-js` коллекции, которого в дереве-объявлении нет и без отдельной проводки не
// будет, — тот же случай «обычная JSX-композиция», что `packages/assembly/README.md` называет
// ПРОТИВОПОЛОЖНЫМ RenderTree).
//
// Значка на узле нет нарочно — тем же решением, что и у остального кита (значок-компонент снят
// из кита целиком, конкретный символ — дело скина, не анатомии).

import {
  createTreeCollection,
  TreeView,
  TreeViewBranch,
  TreeViewBranchContent,
  TreeViewBranchControl,
  TreeViewBranchIndentGuide,
  TreeViewBranchIndicator,
  TreeViewBranchText,
  TreeViewItem,
  TreeViewItemText,
  TreeViewLabel,
  TreeViewNodeProvider,
  TreeViewTree,
  type TreeNode,
} from "@omnifield/probe-web-ui";
import { createMemo, For } from "solid-js";

import { usePreviewLastEvent } from "#/entities/preview/model/store.js";

interface OutputNode extends TreeNode {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly OutputNode[];
}

/** Один узел дерева — ветка (есть дети) либо лист, рекурсивно. */
function OutputTreeNode(props: { node: OutputNode; indexPath: number[] }) {
  return (
    <TreeViewNodeProvider node={props.node} indexPath={props.indexPath}>
      {props.node.children ? (
        <TreeViewBranch>
          <TreeViewBranchControl>
            <TreeViewBranchIndicator>▸</TreeViewBranchIndicator>
            <TreeViewBranchText>{props.node.name}</TreeViewBranchText>
          </TreeViewBranchControl>
          <TreeViewBranchContent>
            <TreeViewBranchIndentGuide />
            <For each={props.node.children}>
              {(child, index) => <OutputTreeNode node={child} indexPath={[...props.indexPath, index()]} />}
            </For>
          </TreeViewBranchContent>
        </TreeViewBranch>
      ) : (
        <TreeViewItem>
          <TreeViewItemText>{props.node.name}</TreeViewItemText>
        </TreeViewItem>
      )}
    </TreeViewNodeProvider>
  );
}

/** Значение листа — как человек его читает, не `[object Object]`. */
function leafOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return String(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Произвольный объект/массив → узлы дерева, рекурсивно — ключ с примитивом внутри становится
 * листом («ключ: значение»), ключ с вложенным объектом/массивом — веткой с тем же разбором
 * внутри. Тем же приёмом, каким рынок показывает JSON деревом (DevTools, jq, json-tree-view) —
 * только БЕЗ схемы (объект здесь — то, что реально пришло, не то, что кто-то заранее описал).
 */
function nodesOf(value: unknown, path: string): OutputNode[] {
  if (value === null || typeof value !== "object") return [];

  const entries = Array.isArray(value)
    ? value.map((item, index) => [String(index), item] as const)
    : Object.entries(value as Record<string, unknown>);

  return entries.map(([key, inner]) => {
    const id = `${path}/${key}`;
    return inner !== null && typeof inner === "object"
      ? { id, name: key, children: nodesOf(inner, id) }
      : { id, name: `${key}: ${leafOf(inner)}` };
  });
}

export function DataOutput() {
  const lastEvent = usePreviewLastEvent();

  const root = createMemo((): OutputNode => ({
    id: "root",
    name: "",
    children: [
      {
        id: "events",
        name: "события",
        children:
          lastEvent() === undefined
            ? [{ id: "events/none", name: "пока ничего не поймано" }]
            : nodesOf(lastEvent(), "events"),
      },
      // МОК (постановка user: «под json стилизуем позже, пока выведи просто моки») — источник
      // (сохранённые записи службы пресетов) этим заходом не подключён, форма ориентировочная.
      {
        id: "skin-files",
        name: "файлы скина",
        children: [
          { id: "skin-files/palette", name: "палитра.json" },
          { id: "skin-files/form-button", name: "форма-omnifield-button.json" },
          { id: "skin-files/outfit", name: "наряд.json" },
        ],
      },
    ],
  }));

  const collection = createMemo(() =>
    createTreeCollection<OutputNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: root(),
    }),
  );

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "var(--space-4)" }}>
      <h2>Выход</h2>

      <TreeView collection={collection()}>
        <TreeViewLabel>Показ</TreeViewLabel>
        <TreeViewTree>
          <For each={collection().rootNode.children}>
            {(node, index) => <OutputTreeNode node={node} indexPath={[index()]} />}
          </For>
        </TreeViewTree>
      </TreeView>
    </div>
  );
}
