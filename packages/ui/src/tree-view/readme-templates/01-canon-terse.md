<!-- пробник 1/5 — «канон как есть»: ровно стиль accordion/README.md и button/README.md сегодня.
     плоские таблицы, минимум прозы, зоны gen:<zone> под каждым разделом. контрольный образец —
     остальные пробники сравниваются с этим. -->

# Tree View

**Group:** — · **Genus:** component · **Footprint:** wide

## Passport

Runtime contract (`entity/passport.ts`) — parts, states, settings, exactly as the engine sees them.

### Anatomy

| part | meaning |
|---|---|
| root | the whole tree — one node |
| item | one repeated node — leaf or branch, the component decides from data |
| control | the item's clickable, focusable row |
| controlIndicator | the indicator inside the row — expand arrow for a branch, selection mark for a leaf |
| content | the item's open slot — a leaf's free content, or a branch's children |

### States

| part | state | mark | meaning |
|---|---|---|---|
| item | focus | [data-focus] | real keyboard/mouse focus is on this node |
| item | selected | [data-selected] | the node is part of the current selection |
| item | disabled | [data-disabled] | the node is disabled |
| item | renaming | [data-renaming] | the label is being edited (`F2` or `startRenaming`) |
| item | checked | [data-checked] | the node is checked, whole — for a tree with checkboxes |
| item | indeterminate | [data-indeterminate] | only part of the node's descendants are checked |
| item | loading | [data-loading] | the node is a branch, loading its children (`loadChildren`) |
| item | open | [data-state="open"] | the node is a branch, expanded — its content is visible |
| item | closed | [data-state="closed"] | the node is a branch, collapsed — its content stays in the markup, hidden |
| control | open | [data-state="open"] | expanded |
| control | closed | [data-state="closed"] | collapsed |
| control | disabled | [data-disabled] | disabled |
| control | selected | [data-selected] | selected |
| control | focus | [data-focus] | focused |
| control | renaming | [data-renaming] | label editing |
| control | checked | [data-checked] | checked |
| control | indeterminate | [data-indeterminate] | partially checked |
| control | loading | [data-loading] | loading children |
| control | hover | :hover | pointer is over the row |
| control | active | :active | the row is being pressed |
| controlIndicator | open | [data-state="open"] | expanded |
| controlIndicator | closed | [data-state="closed"] | collapsed |
| controlIndicator | disabled | [data-disabled] | disabled |
| controlIndicator | selected | [data-selected] | selected |
| controlIndicator | focus | [data-focus] | focused |
| controlIndicator | loading | [data-loading] | loading children |

### Settings

| setting | meaning | default | mark |
|---|---|---|---|

### CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| item | `--depth` | kit | nesting depth of the node — the row's indent is computed from it |

<!-- gen:passport:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:passport:end -->

## Data contract

What an assembly's `bind`/`repeat` paths actually point into (`entity/io.ts`).

### Input

```json
{
  "type": "object",
  "properties": {
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "children": { "type": "array", "items": { "$ref": "#" } }
        },
        "required": ["id", "label"]
      }
    }
  },
  "required": ["items"]
}
```

### Output

```json
{
  "type": "object",
  "properties": {
    "value": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["value"]
}
```

<!-- gen:io:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:io:end -->

## Components

| part | drawn by |
|---|---|
| root | `TreeRoot` |
| item | `TreeItem` |
| control | `TreeControl` |
| controlIndicator | `TreeControlIndicator` |
| content | `TreeContent` |

<!-- gen:components:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:components:end -->

## Assemblies

### base

один уровень, каждый лист подписан и кликабелен, свой клик шлёт наружу, есть открытый слот под лишнее

```
root
  item · repeat: /items · bind: (whole item)
    control · on: click
      text: {label}
      controlIndicator
    content
```

<!-- gen:assemblies:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:assemblies:end -->

## Recipe (proof only)

No named variants — this proof recipe carries no `data-variant` axis of its own.

<!-- gen:recipe:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:recipe:end -->

## Notes

<!-- gen:notes:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:notes:end -->
