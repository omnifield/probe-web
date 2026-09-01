<!-- пробник 5/5 — «диаграмма + предупреждения»: ascii-дерево анатомии как якорь страницы,
     находки/ловушки — блоками-предупреждениями (github alert-синтаксис, не эмодзи), состояния
     сгруппированы по ТИПУ метки (атрибут vs псевдокласс), в конце — перекрёстные ссылки. -->

# Tree View

**Group:** — · **Genus:** component · **Footprint:** wide

```
root
└─ item[]                    leaf or branch — item decides from node.children
   ├─ control                clickable row
   │  └─ controlIndicator    arrow (branch) / check (leaf)
   └─ content                open slot: free content, or nested item[]
```

> [!NOTE]
> Ark ships a leaf and a branch as two separate part families. This kit does not: `item` is the
> one schema-facing name for both, and picks the real Ark primitive at render time from
> `node.children`. An assembly never names "leaf" or "branch" — only `item`.

## States

By mark kind — attribute states describe what the connector currently thinks is true; pseudo
states describe what the pointer is doing right now.

**Attribute-marked**

| part | state | attribute |
|---|---|---|
| item, control, controlIndicator | open / closed | `data-state="open"` / `"closed"` |
| item, control, controlIndicator | disabled | `data-disabled` |
| item, control, controlIndicator | selected | `data-selected` |
| item, control, controlIndicator | focus | `data-focus` |
| item, control, controlIndicator | loading | `data-loading` |
| item, control | renaming | `data-renaming` |
| item, control | checked / indeterminate | `data-checked` / `data-indeterminate` |

**Pseudo-marked** (control only)

| state | selector |
|---|---|
| hover | `:hover` |
| active | `:active` |

## Variables

| part | variable | set by |
|---|---|---|
| item | `--depth` | kit |

> [!WARNING]
> `content`'s visibility (for a branch) comes from the native `hidden` attribute, not a state — the
> passport declares no `open`/`closed` on `content` at all. A recipe that puts an unconditional
> `display` in `content`'s base rule will outrank `[hidden]` by specificity (two attribute
> selectors beat one) and the branch will stop collapsing while still toggling the attribute
> correctly underneath. Put `display` inside a state, never the base, for this part.

## Data contract

```json
{ "items": [{ "id": "string", "label": "string", "children": ["recursive, optional"] }] }
```
→ emits `{ "value": ["string"] }` on selection change.

## Components

| part | component |
|---|---|
| root | `TreeRoot` |
| item | `TreeItem` |
| control | `TreeControl` |
| controlIndicator | `TreeControlIndicator` |
| content | `TreeContent` |

## See also

- [`packages/ui/README.md`](../../README.md) — kit-wide rules this component follows (base assembly
  empty, `display` vs `[hidden]`, no documentation inside component code).
- [`shared/data/anatomy.ts`](../../shared/data/anatomy.ts) — where `control`/`controlIndicator`/
  `content` come from as a reusable vocabulary, not typed here by hand.
- [`../accordion/README.md`](../../accordion/README.md) — the kit's other expand/collapse
  component; contrast `content`'s hidden-attribute collapse here against the accordion's measured
  `--height` animation.

## Notes

<!-- user:start -->
<!-- user:end -->
