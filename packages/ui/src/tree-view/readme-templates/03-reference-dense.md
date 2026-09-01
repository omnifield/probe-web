<!-- пробник 3/5 — «плотный справочник»: карточка фактов сверху, отдельная таблица НА КАЖДУЮ
     часть (не одна большая), редко нужное — под <details>, чтобы страница читалась с одного
     экрана, а детали были на расстоянии одного клика. -->

# Tree View

| | |
|---|---|
| **Package** | `@omnifield/probe-web-ui` |
| **Group** | — |
| **Genus** | component |
| **Footprint** | wide |
| **Parts** | 5 (`root` `item` `control` `controlIndicator` `content`) |
| **Settings** | none |
| **Variant axis** | `data-variant` |
| **Assemblies** | `base` |

## root

_the whole tree — one node_

No states. No CSS variables.

## item

_one repeated node — leaf or branch, decided from `node.children` at render time_

| state | mark |
|---|---|
| `focus` | `[data-focus]` |
| `selected` | `[data-selected]` |
| `disabled` | `[data-disabled]` |
| `renaming` | `[data-renaming]` |
| `checked` | `[data-checked]` |
| `indeterminate` | `[data-indeterminate]` |
| `loading` | `[data-loading]` |
| `open` | `[data-state="open"]` |
| `closed` | `[data-state="closed"]` |

Variable: `--depth` (set by kit) — nesting depth, drives the row's indent.

## control

_the item's clickable, focusable row_

| state | mark |
|---|---|
| `open` / `closed` | `[data-state]` |
| `disabled` | `[data-disabled]` |
| `selected` | `[data-selected]` |
| `focus` | `[data-focus]` |
| `renaming` | `[data-renaming]` |
| `checked` / `indeterminate` | `[data-checked]` / `[data-indeterminate]` |
| `loading` | `[data-loading]` |
| `hover` / `active` | `:hover` / `:active` |

## controlIndicator

_the indicator inside the row — expand arrow for a branch, selection mark for a leaf_

| state | mark |
|---|---|
| `open` / `closed` | `[data-state]` |
| `disabled` | `[data-disabled]` |
| `selected` | `[data-selected]` |
| `focus` | `[data-focus]` |
| `loading` | `[data-loading]` |

## content

_the item's open slot — a leaf's free content, or a branch's children_

No states of its own — visibility for a branch follows the native `hidden` attribute, not a state
this table would show.

<details>
<summary>Data contract (<code>entity/io.ts</code>)</summary>

```json
{ "input": { "items": [{ "id": "string", "label": "string", "children": ["…"] }] },
  "output": { "value": ["string"] } }
```

</details>

<details>
<summary>Components (<code>components/</code>)</summary>

| part | drawn by |
|---|---|
| root | `TreeRoot` |
| item | `TreeItem` |
| control | `TreeControl` |
| controlIndicator | `TreeControlIndicator` |
| content | `TreeContent` |

</details>

<details>
<summary>Assembly: <code>base</code></summary>

```
root
  item · repeat: /items · bind: (whole item)
    control · on: click → controlClick
      text: {label}
      controlIndicator
    content
```

</details>

<details>
<summary>Notes</summary>

<!-- user:start -->
_(anything that doesn't fit a table)_
<!-- user:end -->

</details>
