# Accordion

**Group:** disclosure · **Genus:** component · **Footprint:** regular

## Passport

Runtime contract (`entity/passport.ts`) — parts, states, settings, exactly as the engine sees them.

### Anatomy

| part | meaning |
|---|---|
| root | the whole set of items — one node wrapping every item |
| item | one item — a trigger together with its content |
| itemTrigger | the item's button — expands and collapses it |
| itemContent | the item's content — the area that gets expanded |
| itemIndicator | the expansion indicator — an arrow placed by the consumer |

### States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| item | open | [data-state="open"] | the item is expanded — its content is visible |
| item | disabled | [data-disabled] | the item is disabled — it cannot be expanded |
| item | focus | [data-focus] | focus is on this item's trigger |
| itemTrigger | open | [data-state="open"] | the item is expanded — its content is visible |
| itemTrigger | focus | [data-focus] | focus is on this item's trigger |
| itemTrigger | disabled | :disabled | the button is disabled — clicking it does not expand the item |
| itemTrigger | hover | :hover | pointer is over the button |
| itemTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| itemTrigger | active | :active | the button is being held down |
| itemContent | open | [data-state="open"] · may be absent | the item is expanded — its content is visible |
| itemContent | closed | [data-state="closed"] | the item is collapsed — its content is hidden, but the node stays in place |
| itemContent | disabled | [data-disabled] | the item is disabled — it cannot be expanded |
| itemContent | focus | [data-focus] | focus is on this item's trigger |
| itemIndicator | open | [data-state="open"] | the item is expanded — its content is visible |
| itemIndicator | disabled | [data-disabled] | the item is disabled — it cannot be expanded |
| itemIndicator | focus | [data-focus] | focus is on this item's trigger |

### Settings

| setting | meaning | default | mark |
|---|---|---|---|
| orientation | how items are laid out: top to bottom or left to right — this drives keyboard navigation and aria | `vertical` | [data-orientation] |
| multiple | whether several items can stay expanded at once | `false` | — |
| collapsible | whether the last expanded item can be closed, leaving the whole accordion collapsed | `false` (depends on `multiple`) | — |

### CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| itemContent | `--height` | kit | the measured height of the expanded content |
| itemContent | `--width` | kit | the measured width of the expanded content — needed by a horizontal accordion |

<!-- gen:passport:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:passport:end -->

## Data contract

What an assembly's `bind`/`repeat` paths actually point into (`entity/io.ts`) — separate from the look, the same input can be dressed by any recipe.

### Input

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "items": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "value": {
                  "type": "string"
                },
                "label": {
                  "type": "string"
                }
              },
              "required": [
                "value",
                "label"
              ],
              "additionalProperties": false
            }
          },
          "activeValues": {
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "id",
          "title"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "sections"
  ],
  "additionalProperties": false
}
```

### Output

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "value": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "value"
  ],
  "additionalProperties": false
}
```

<!-- gen:io:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:io:end -->

## Components

Real Solid implementations, one per anatomy part (`components/kit.tsx`) — what actually draws each part, not just its name in the passport.

| part | drawn by |
|---|---|
| root | `Accordion` |
| item | `AccordionItem` |
| itemTrigger | `AccordionItemTrigger` |
| itemContent | `AccordionItemContent` |
| itemIndicator | `AccordionItemIndicator` |

<!-- gen:components:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:components:end -->

## Assemblies

Worked `RenderTree` trees (`playground/assemblies/`) — structural skeletons proving the passport composes, not the primary way to use the component (plain JSX composition is).

### base

разделы из данных: заголовок раздела на триггере, контент пустой — место под содержимое потребителя

```
root
  item · repeat: /sections · bind: value
    itemTrigger · on: click
      text: {title}
      itemIndicator
    itemContent · bind: variant
```

### action-list

разделы, а в контенте каждого — настоящий Listbox из общего реестра, не своя копия

```
root
  item · repeat: /sections · bind: value
    itemTrigger · on: click
      text: {title}
      itemIndicator
    itemContent
      listbox · bind: items, value
        listbox.content
          listbox.item · repeat: items · bind: item · on: click
            listbox.itemText
              text: {label}
            listbox.itemIndicator
              icon: "✓"
```

<!-- gen:assemblies:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:assemblies:end -->

## Recipe (proof only)

Proves the passport CAN be dressed by the real skin mechanism (`playground/recipe.ts`) — never ships as-is; a real look for this component lives in `packages/skin`, not here.

No named variants — this proof recipe carries no `data-variant` axis of its own.

Also conditioned by the component's own settings:

| setting | conditions styled |
|---|---|
| orientation | horizontal |

<!-- gen:recipe:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:recipe:end -->

## Notes

<!-- gen:notes:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- gen:notes:end -->
