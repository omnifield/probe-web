# Button

**Group:** actions · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the whole button — a single node, a native `<button type="button">` by default |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | hover | :hover | pointer is over the button |
| root | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| root | active | :active | the button is being held down |
| root | disabled | [data-disabled] | cannot be pressed; the button does not call its handler |
| root | busy | [aria-busy="true"] | work is in progress — the consumer sets this attribute together with `disabled` |
| root | expanded | [data-expanded] | the button has expanded what it controls — the attribute arrives from an outer component |
| root | pressed | [data-pressed] | a toggle button is pressed — pressedness belongs to the outer component, the look belongs to the button |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
Button is the kit's **actions** primitive: one node the user presses to make something happen. It
renders a native `<button type="button">` by default and ships no styling of its own — the look is
a skin's job, and the name of that look is a free-text variant a human chooses in the editor, which
the kit passes through untouched.

It is also the kit's first component that Ark UI does not provide, because a headless button is
just a native element with nothing to wrap. What it sits on instead is
[`@kobalte/core/button`](https://kobalte.dev) — the WAI-ARIA Button pattern — for the places where
the native element genuinely falls short.

### Features

- **One part, one node.** The label, the icon, any spinner are the consumer's own nodes; the button
  makes no promise about them and adds no wrapper.
- **`type="button"` by default**, from Kobalte. Without it a button inside a form submits that form
  on the very first click — the most common hidden defect in hand-rolled buttons.
- **Polymorphic via `as`.** Rendered as something other than `<button>` (`as="a"`, `as="div"`),
  Kobalte supplies `role="button"`, `tabindex`, and `aria-disabled` itself, and suppresses keyboard
  activation while disabled.
- **Seven states, three of them pseudo-classes.** `hover`, `focus-visible`, and `active` are the
  browser's business, not the component's — declaring them as attributes would be a lie in the data.
- **Disabledness is attribute-marked** (`data-disabled`) because the button owns it: a disabled
  button has neither `:hover` nor `:active`, so without a mark of its own that state would be
  invisible from outside.
- **No settings at all** — and that is declared as a fact, not left as an omission. The button
  accepts none of the kit's closed settings vocabulary; should one ever appear, the type forces it
  to be declared.
- **No `loading` prop.** A busy button is assembled from parts that already exist
  (`disabled` + `aria-busy="true"`), so the kit never freezes in the decision that a loading button
  hides its content.

### Anatomy

One part, so the skeleton is about what goes *inside* it rather than how parts nest. `root` accepts
text and icon content only — deliberately not layout or arbitrary components: a button is an
endpoint you press, not a place for a tree.

```tsx
import { Button } from "@omnifield/probe-web-ui";

<Button>
  {/* content: text and/or icon */}
</Button>
```

### Examples

**A plain button.** The common case: a label and a click handler.

```tsx
import { Button } from "@omnifield/probe-web-ui";

<Button onClick={save}>Save</Button>
```

**Rendered as a link.** `as` swaps the element while keeping the button's behavior contract; the
target element's own props (here `href`) come along.

```tsx
<Button as="a" href="/docs">Documentation</Button>
```

**Disabled.** The handler is not called, and the node carries `data-disabled` for the skin.

```tsx
<Button disabled onClick={save}>Save</Button>
```

**Busy.** There is no `loading` prop — busyness is `aria-busy="true"` set by the consumer alongside
`disabled`, and what to show meanwhile stays the consumer's choice (the kit ships no spinner
graphic).

```tsx
<Button disabled aria-busy="true">
  <Spinner />
  Saving
</Button>
```

**Icon and text together.** Both are allowed inside `root`; the button renders whatever it is given
and adds no icon of its own.

```tsx
<Button onClick={addItem}>
  <PlusIcon aria-hidden="true" />
  Add item
</Button>
```

**Naming a variant.** The variant axis is an **attribute, not a prop** — `data-variant`. There is
no `variant` prop, and an unnamed variant sets no attribute at all: the kit owns no default variant
name, because names are a human's call made together with a skin.

```tsx
<Button data-variant="primary">Save</Button>
```

**Composed into an outer component.** This is where `expanded` and `pressed` come from — the button
never sets `data-expanded` or `data-pressed` itself. When a button becomes a toggle or a trigger,
the outer component supplies the behavior and the state while the button keeps its own address,
because visually the thing still *is* a button. Note the direction: `as` belongs to `Button`, which
takes the outer component.

```tsx
import { Button, ToggleGroup, ToggleGroupItem } from "@omnifield/probe-web-ui";

<ToggleGroup>
  <Button as={ToggleGroupItem} value="bold">B</Button>
</ToggleGroup>
```

### Styling hooks

Every state above carries a `mark`, and each mark is a real selector a skin can hook: the
pseudo-classes `:hover`, `:focus-visible`, `:active` straight from the browser, and the attributes
`[data-disabled]`, `[aria-busy="true"]`, `[data-expanded]`, `[data-pressed]`. The node itself is
addressed by its anatomy attributes (`data-scope="button"`, `data-part="root"`), declared once in
`entity/anatomy.ts` so the kit's markup and the skin's selector cannot drift apart. `data-variant`
carries the variant name on the same node. These marks are the whole intended styling surface —
the kit ships no classes and no default look.

### Accessibility

Follows the WAI-ARIA APG **Button** pattern, by way of Kobalte. As a native `<button>` the browser
provides the semantics; via `as` Kobalte restores `role="button"`, `tabindex="0"`, and
`aria-disabled`, and blocks keyboard activation when disabled.

| Key | What it does |
|---|---|
| `Space` | Activates the button (on key release) |
| `Enter` | Activates the button |
| `Tab` | Moves focus to the button; a disabled button is skipped |

Two things stay the consumer's responsibility, because the kit cannot know them: an icon-only
button needs its own accessible name (`aria-label`), and a button that expands or controls another
region needs the corresponding `aria-expanded` / `aria-controls` — which in this kit normally
arrives from the outer component the button is composed into.

## Assembly & skin notes

Concrete things that cost real time to find — read this before writing a new assembly that
references `button`, or a new variant of its recipe.

- **Referencing it from someone else's assembly needs no children.** `button` is the one component
  in the kit today with `passport.selfAssembly` — a bare `{ node: "button" }` reference (root only;
  it has no other parts to address with a dotted form) unfolds its own click → `"select"` event
  wiring automatically. Every other component covered here does NOT have this — see their own
  notes below before assuming the same shortcut applies.
- **A variant name reaches the DOM through `bind`, never a literal prop passthrough on the
  reference** (PWEB-166..172) — `{ props: { "data-variant": "primary" } }` on a `button` reference
  works because `props` is a real assembly field, not because the reference specially understands
  `data-variant`; the button itself sets no default variant name.
- **One part, no dotted addressing ever.** `anatomy` has exactly `root` — there is nothing to
  reference as `button.<part>`, unlike every composite component in this kit.
<!-- user:end -->
