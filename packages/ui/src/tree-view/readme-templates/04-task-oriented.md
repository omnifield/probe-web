<!-- пробник 4/5 — «от задачи, не от анатомии»: заголовки — это то, что человек хочет СДЕЛАТЬ
     (плоский список, вложенные группы, выделение, свой значок раскрытия), а не имена частей.
     справочные таблицы уезжают в конец как приложение — на них ссылаются, а не с них начинают. -->

# Tree View

**Group:** — · **Genus:** component · **Footprint:** wide

A hierarchical list built from `root` → `item` → `control`/`content`. This page is organized by
what you're trying to do; the full part/state reference is the [Appendix](#appendix) at the bottom.

## Render a flat list

Every node is a leaf — no `children`, so every `item` renders as a plain row.

```tsx
<TreeRoot collection={collection}>
  <TreeItem node={node}>
    <TreeControl>
      {node.label}
      <TreeControlIndicator />
    </TreeControl>
    <TreeContent />
  </TreeItem>
</TreeRoot>
```

## Render nested groups

Give a node `children` and `item` renders it as a real Ark branch automatically — no separate
component to reach for.

```tsx
<TreeItem node={groupNode}>
  <TreeControl>{groupNode.label}<TreeControlIndicator /></TreeControl>
  <TreeContent>
    <For each={groupNode.children}>{(child) => <TreeItem node={child}>…</TreeItem>}</For>
  </TreeContent>
</TreeItem>
```

## React to a click

`control` carries the click — compose the assembly's `on.click`, or a plain `onClick`, onto it, not
onto `item`.

```
control · on: click → { name: "controlClick", payload: (whole item) }
```

## Style the expand/collapse arrow

`controlIndicator` is the address; the graphic itself is the consumer's, the kit puts nothing there
by default. It carries `open`/`closed` (`[data-state]`) for a branch, `selected` (`[data-selected]`)
for a leaf — same part, two different meanings depending on what `item` decided to render.

```css
[data-scope="tree-view"][data-part="control-indicator"][data-state="open"] {
  transform: rotate(90deg);
}
```

## Indent by depth

`item` owns `--depth`; anything that needs the indent (typically `control`) reaches it through the
skin's `ancestors` mechanism, not a bare `var(--depth)` reference of its own.

```
paddingInlineStart: calc(var(--space-3) + var(--depth) * var(--space-6))
```

## Avoid the collapse-that-doesn't-collapse trap

A branch's `content` is hidden by the native `hidden` attribute, not a state. An unconditional
`display` in a recipe's base rule outranks `[hidden]` by CSS specificity and the branch stops
visually collapsing even though the attribute toggles correctly — keep `display` inside `open`
(never in the base) for anything that sits on `content` or `controlIndicator`.

---

## Appendix

### Parts

| part | meaning |
|---|---|
| root | the whole tree |
| item | one repeated node — leaf or branch |
| control | the clickable row |
| controlIndicator | the row's indicator |
| content | the open slot |

### States

| part | states |
|---|---|
| item | focus, selected, disabled, renaming, checked, indeterminate, loading, open, closed |
| control | item's states + hover, active |
| controlIndicator | open, closed, disabled, selected, focus, loading |

### Data contract

`{ items: [{ id, label, children? }] }` in, `{ value: string[] }` out (`entity/io.ts`).

<!-- user:start -->
<!-- user:end -->
