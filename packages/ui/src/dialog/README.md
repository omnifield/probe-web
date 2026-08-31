# Dialog

**Group:** overlays · **Genus:** component · **Footprint:** regular

## Anatomy

| part | meaning |
|---|---|
| trigger | opens the dialog |
| backdrop | the dimmed overlay behind the dialog |
| positioner | centers the dialog's content in the viewport — a pure wrapper, no look of its own |
| content | the dialog's own panel |
| title | the dialog's own title |
| description | the dialog's own description |
| closeTrigger | closes the dialog |

## States

| part | state | mark | meaning |
|---|---|---|---|
| trigger | open | [data-state="open"] | the dialog is open |
| trigger | closed | [data-state="closed"] | the dialog is closed |
| trigger | current | [data-current] | in a multi-trigger dialog, this is the trigger that opened it |
| trigger | hover | :hover | pointer is over this button |
| trigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| trigger | active | :active | this button is being held down |
| backdrop | open | [data-state="open"] | the dialog is open |
| backdrop | closed | [data-state="closed"] | the dialog is closed |
| positioner | — | — | — |
| content | open | [data-state="open"] | the dialog is open |
| content | closed | [data-state="closed"] | the dialog is closed |
| title | — | — | — |
| description | — | — | — |
| closeTrigger | hover | :hover | pointer is over this button |
| closeTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| closeTrigger | active | :active | this button is being held down |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

Dialog is the kit's modal — a focused panel that sits above the page, dims everything behind it, and
traps focus until dismissed. Seven parts; the root itself renders no DOM node, holding only open
state and context.

## Features

- **The root is pure context** — `Dialog` renders nothing; `trigger`/`backdrop` are real DOM
  siblings of `positioner`, not its ancestors or descendants, tied together only through that
  shared context. The passport's own `root` stands in as `positioner`, since anatomy needs some
  part to call the root.
- **Controlled or uncontrolled open state** — `open` + `onOpenChange` for controlled use,
  `defaultOpen` for uncontrolled.
- **Alert-dialog mode** — `role="alertdialog"` changes behavior, not just semantics: focus lands on
  the close/cancel control by default, and outside clicks stop dismissing it — appropriate for
  confirming a destructive action.
- **Modal by default** — `modal` (default `true`) disables pointer interaction and hides content
  behind the dialog from assistive tech; `modal={false}` allows interacting with the page behind it
  and also turns off focus trapping and scroll prevention.
- **Configurable dismissal** — `closeOnEscape` and `closeOnInteractOutside` (both default `true`)
  can be turned off independently; `onEscapeKeyDown`/`onInteractOutside` let a consumer intercept
  and `preventDefault()` a close attempt (e.g. to confirm discarding unsaved changes) instead of
  disabling it outright.
- **Focus is managed, not left to the browser** — `trapFocus` (default `true`) keeps Tab cycling
  inside the dialog; `initialFocusEl`/`finalFocusEl` override which element receives focus on open
  and close, `restoreFocus` returns it to the trigger by default.
- **Multiple triggers, one dialog** — a `trigger`'s `value` distinguishes which trigger opened a
  shared dialog; `onTriggerValueChange` reports which one, and that trigger alone carries
  `data-current`.
- **Lazy mounting** — `lazyMount` (content mounts only once opened) plus `unmountOnExit` (unmounts
  again on close) avoid paying for dialog content that may never open; Ark's own guidance is to
  reach for these rather than conditionally rendering `Dialog` itself, which breaks focus/scroll
  cleanup.
- **`closeTrigger` carries no mark of its own** — a real `<button>` addressed only by
  `:hover`/`:focus-visible`/`:active`, the same shape the popover's own `closeTrigger` has.

## Anatomy

```tsx
import {
  Dialog,
  DialogTrigger,
  DialogBackdrop,
  DialogPositioner,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogCloseTrigger,
} from "@omnifield/probe-web-ui";

<Dialog>
  <DialogTrigger>{/* text or icon */}</DialogTrigger>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>{/* text */}</DialogTitle>
      <DialogDescription>{/* text */}</DialogDescription>
      {/* any body content the consumer wants */}
      <DialogCloseTrigger>{/* text or icon */}</DialogCloseTrigger>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

## Examples

### Basic

```tsx
<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogCloseTrigger>✕</DialogCloseTrigger>
      <DialogTitle>Welcome Back</DialogTitle>
      <DialogDescription>Sign in to your account to continue.</DialogDescription>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

### Alert dialog, for a destructive confirmation

```tsx
<Dialog role="alertdialog">
  <DialogTrigger>Delete Account</DialogTrigger>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Are you absolutely sure?</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
      <DialogCloseTrigger>Cancel</DialogCloseTrigger>
      <button data-variant="solid" onClick={deleteAccount}>Delete Account</button>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

### Controlled, with confirmation before closing

```tsx
import { createSignal } from "solid-js";

const [open, setOpen] = createSignal(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = createSignal(false);

<Dialog
  open={open()}
  onOpenChange={(details) => setOpen(details.open)}
  onInteractOutside={(event) => {
    if (hasUnsavedChanges()) event.preventDefault();
  }}
>
  <DialogTrigger>Edit</DialogTrigger>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Edit Content</DialogTitle>
      <DialogCloseTrigger>Close</DialogCloseTrigger>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

### Non-modal

```tsx
<Dialog modal={false}>
  <DialogTrigger>Open Non-Modal Dialog</DialogTrigger>
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Non-Modal Dialog</DialogTitle>
      <DialogDescription>You can still interact with the page behind this one.</DialogDescription>
      <DialogCloseTrigger>✕</DialogCloseTrigger>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

### Shared across multiple triggers

```tsx
<Dialog onTriggerValueChange={(details) => setActiveUserId(details.value)}>
  <For each={users}>{(user) => <DialogTrigger value={user.id}>Edit {user.name}</DialogTrigger>}</For>
  <DialogBackdrop />
  <DialogPositioner>
    <DialogContent>
      <DialogTitle>Edit User</DialogTitle>
      {/* body reads whichever user's id came through onTriggerValueChange */}
      <DialogCloseTrigger>✕</DialogCloseTrigger>
    </DialogContent>
  </DialogPositioner>
</Dialog>
```

## Styling hooks

`backdrop`/`content`/`trigger` all carry the open/closed pair (see `packages/skin`); `trigger`
additionally carries `data-current` in a multi-trigger dialog. `positioner` carries no state at all
— it's pure positioning (typically `display: flex; place-items: center`), and unlike the
popover's/select's/date-picker's own positioner, it has no floating-UI geometry variables to read,
since a dialog centers with plain CSS rather than anchoring to a trigger. `content` also receives
`data-nested`/`data-has-nested` and a `--nested-layer-count` variable when dialogs stack, useful for
a zoom-out effect on the parent — real Ark behavior, though not currently declared in this file's
own passport/CSS-variables table.

## Accessibility

Dialog follows the WAI-ARIA [Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

| Key | What it does |
|---|---|
| `Enter` | When focus is on the trigger, opens the dialog |
| `Tab` | Moves focus to the next focusable element inside the dialog — focus is trapped there |
| `Shift + Tab` | Moves focus to the previous focusable element — same trap |
| `Esc` | Closes the dialog and moves focus to the trigger (or `finalFocusEl`, if set) |
<!-- user:end -->
