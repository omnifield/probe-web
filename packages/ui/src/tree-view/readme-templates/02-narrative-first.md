<!-- пробник 2/5 — «сначала рассказ»: короткий питч и особенности прозой ДО таблиц (как Notes у
     button, только вынесено в начало документа, а не спрятано внизу). таблицы остаются, но
     читатель сперва понимает, что это и зачем, а уже потом сверяется со спецификацией. -->

# Tree View

**Group:** — · **Genus:** component · **Footprint:** wide

A hierarchical list: nodes at any depth, each either a leaf or a branch with its own nested
children. Where Ark's own tree-view splits a leaf and a branch into two separate part families
(`item`/`itemText`/`itemIndicator` vs `branch`/`branchControl`/…/`branchContent`), this kit
collapses them into one — `item` looks at its own data and decides, at render time, which real
Ark primitive it actually is. An assembly author never writes that branch; they write `item` once
and get both.

### Features

- **Five parts, not seventeen.** `root` / `item` / `control` / `controlIndicator` / `content` — the
  whole vocabulary a skin or an assembly author ever needs to know.
- **Leaf/branch is the component's problem, not the schema's.** `item` reads `node.children` and
  renders the matching Ark primitive; a rename, a checkbox tree, lazy-loaded children — none of it
  changes what an assembly looks like.
- **`control`/`content` are kit-wide names, not tree-specific.** The clickable-header-plus-indicator
  group and the open-content slot are a general pattern (`shared/data/anatomy.ts`) — any future
  component with the same shape reuses the same two names instead of inventing its own.
- **No animation on collapse.** The installed `@zag-js/tree-view` connector only ever toggles the
  native `hidden` attribute on a branch's content — there is no `--height` to animate, unlike the
  accordion.

## Anatomy at a glance

```
root
└── item            (repeated; leaf or branch, decided from data)
    ├── control      (the clickable row)
    │   └── controlIndicator
    └── content      (open slot — a leaf's free content, or a branch's nested items)
```

## Reference

### Parts

| part | meaning |
|---|---|
| root | the whole tree — one node |
| item | one repeated node — leaf or branch |
| control | the item's clickable, focusable row |
| controlIndicator | the indicator inside the row |
| content | the item's open slot |

### States

| part | states |
|---|---|
| item | `focus` `selected` `disabled` `renaming` `checked` `indeterminate` `loading` `open` `closed` |
| control | all of `item`'s, plus `hover` `active` |
| controlIndicator | `open` `closed` `disabled` `selected` `focus` `loading` |
| content | — |

### CSS Variables

| part | variable | meaning |
|---|---|---|
| item | `--depth` | nesting depth — drives the row's indent |

## Data contract

```json
// input — entity/io.ts
{ "items": [{ "id": "string", "label": "string", "children": [/* recursive */] }] }
```

```json
// output
{ "value": ["string"] }
```

## Using it

```tsx
import { TreeRoot, TreeItem, TreeControl, TreeContent, createTreeCollection } from "@omnifield/probe-web-ui";

const collection = createTreeCollection({
  nodeToValue: (node) => node.id,
  nodeToString: (node) => node.label,
  rootNode: { id: "ROOT", children: items },
});

<TreeRoot collection={collection}>
  {/* one <TreeItem> per node, composed by the assembly or by hand */}
</TreeRoot>
```

## Notes

<!-- user:start -->
_(worked examples, gotchas, decisions that don't fall out of the tables above)_
<!-- user:end -->
