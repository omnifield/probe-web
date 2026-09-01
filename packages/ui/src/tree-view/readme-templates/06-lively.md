<!-- пробник 6/5 — «повеселее»: плашки-предупреждения (github alert), ASCII-схема как якорь,
     таблица-визитка вместо серой строки метаданных, живой тэглайн, смайлики — по прямой просьбе
     user в этом заходе (в остальных пробниках их нет). -->

# 🌳 Tree View

_One list. Any depth. The component figures out leaf vs branch so you don't have to._

| | |
|---|---|
| 🏷️ **Group** | — |
| 🧬 **Genus** | component |
| 📐 **Footprint** | wide |
| 📦 **Package** | `@omnifield/probe-web-ui` |

```
root
└─ item[] 🍃/🌿           leaf or branch — item decides from node.children
   ├─ control ▶️           clickable row
   │  └─ controlIndicator  arrow (branch) / check (leaf)
   └─ content 📂           open slot: free content, or nested item[]
```

> [!TIP]
> Ark ships a leaf and a branch as two separate part families. This kit doesn't make you pick —
> `item` is the one name for both, and quietly becomes the right one at render time.

## Usage

**A flat list** 🍃 — every node has no `children`, so every row is a leaf.

```tsx
import {
  TreeRoot,
  TreeItem,
  TreeControl,
  TreeControlIndicator,
  TreeContent,
  createTreeCollection,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

const items = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
];

const collection = createTreeCollection({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.label,
  rootNode: { id: "ROOT", label: "", children: items },
});

<TreeRoot collection={collection}>
  <For each={items}>
    {(node) => (
      <TreeItem node={node}>
        <TreeControl>
          {node.label}
          <TreeControlIndicator />
        </TreeControl>
        <TreeContent />
      </TreeItem>
    )}
  </For>
</TreeRoot>;
```

**A nested tree** 🌿 — give a node `children` and it grows a branch on its own.

```tsx
function Node(props: { node: TreeNode }) {
  return (
    <TreeItem node={props.node}>
      <TreeControl>
        {props.node.label}
        <TreeControlIndicator />
      </TreeControl>
      <TreeContent>
        <For each={props.node.children}>{(child) => <Node node={child} />}</For>
      </TreeContent>
    </TreeItem>
  );
}
```

> [!WARNING]
> `content`'s visibility on a branch rides the native `hidden` attribute, not a state. An
> unconditional `display` in a recipe's base rule will out-rank `[hidden]` by specificity — the
> branch will stop collapsing while the attribute still toggles correctly underneath. Keep
> `display` inside a state (`open`), never the base. 🐛➡️✅

## Reference

| part | meaning |
|---|---|
| 🌳 `root` | the whole tree — one node |
| 🍃🌿 `item` | one repeated node — leaf or branch, `item`'s own call |
| ▶️ `control` | the clickable, focusable row |
| 🔽 `controlIndicator` | arrow for a branch, check for a leaf |
| 📂 `content` | the open slot — free content, or nested `item[]` |

## Notes

<!-- user:start -->
<!-- user:end -->
