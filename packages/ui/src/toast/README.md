# Toast

**Group:** overlays · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| group | the toast region for one placement corner — wraps every live toast anchored there |
| root | one live toast's own wrapper |
| title | this toast's own title |
| description | this toast's own description |
| actionTrigger | this toast's optional action button (e.g. "Undo") — clicking it also dismisses the toast |
| closeTrigger | dismisses this toast |

## States

| part | state | mark | meaning |
|---|---|---|---|
| group | top-start | [data-placement="top-start"] | positioned at the top, start side |
| group | top | [data-placement="top"] | positioned at the top, centered |
| group | top-end | [data-placement="top-end"] | positioned at the top, end side |
| group | bottom-start | [data-placement="bottom-start"] | positioned at the bottom, start side |
| group | bottom | [data-placement="bottom"] | positioned at the bottom, centered |
| group | bottom-end | [data-placement="bottom-end"] | positioned at the bottom, end side |
| group | side-top | [data-side="top"] | on the top half of the viewport — the vertical half of `placement`, addressable on its own |
| group | side-bottom | [data-side="bottom"] | on the bottom half of the viewport — the vertical half of `placement`, addressable on its own |
| group | align-start | [data-align="start"] | aligned to the start edge — the horizontal half of `placement`, addressable on its own |
| group | align-center | [data-align="center"] | centered — the horizontal half of `placement`, addressable on its own |
| group | align-end | [data-align="end"] | aligned to the end edge — the horizontal half of `placement`, addressable on its own |
| root | top-start | [data-placement="top-start"] | positioned at the top, start side |
| root | top | [data-placement="top"] | positioned at the top, centered |
| root | top-end | [data-placement="top-end"] | positioned at the top, end side |
| root | bottom-start | [data-placement="bottom-start"] | positioned at the bottom, start side |
| root | bottom | [data-placement="bottom"] | positioned at the bottom, centered |
| root | bottom-end | [data-placement="bottom-end"] | positioned at the bottom, end side |
| root | side-top | [data-side="top"] | on the top half of the viewport — the vertical half of `placement`, addressable on its own |
| root | side-bottom | [data-side="bottom"] | on the bottom half of the viewport — the vertical half of `placement`, addressable on its own |
| root | align-start | [data-align="start"] | aligned to the start edge — the horizontal half of `placement`, addressable on its own |
| root | align-center | [data-align="center"] | centered — the horizontal half of `placement`, addressable on its own |
| root | align-end | [data-align="end"] | aligned to the end edge — the horizontal half of `placement`, addressable on its own |
| root | open | [data-state="open"] | the toast is showing |
| root | closed | [data-state="closed"] | the toast is dismissed or has not yet appeared |
| root | success | [data-type="success"] | a success-type toast |
| root | error | [data-type="error"] | an error-type toast |
| root | loading | [data-type="loading"] | a loading-type toast |
| root | info | [data-type="info"] | an info-type toast |
| root | warning | [data-type="warning"] | a warning-type toast |
| root | mounted | [data-mounted] | the toast has mounted into the DOM |
| root | paused | [data-paused] | the toast's auto-dismiss timer is paused (e.g. the pointer is over it) |
| root | first | [data-first] | this is the frontmost toast in its group |
| root | sibling | [data-sibling] | this toast is NOT the frontmost one — a sibling behind it |
| root | stack | [data-stack] | toasts in this group are stacked (not overlapping) |
| root | overlap | [data-overlap] | toasts in this group are overlapping rather than stacked |
| title | — | — | — |
| description | — | — | — |
| actionTrigger | hover | :hover | pointer is over this button |
| actionTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| actionTrigger | active | :active | this button is being held down |
| closeTrigger | hover | :hover | pointer is over this button |
| closeTrigger | focus-visible | :focus-visible | focus arrived from the keyboard — an outline is needed; on a mouse click it would be noise |
| closeTrigger | active | :active | this button is being held down |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

Toast is a floating notification queue — brief messages that appear on the screen, stack or
overlap, and dismiss themselves after a timeout (or stay until the user closes them). It's the
kit's only component backed by two machines at once: a single store holding every live toast
(`group`) and one machine per toast (`root`).

## Features

- **Not composed like the rest of the kit** — there's no `Toast` root a consumer opens with props.
  A store built once with `createToaster(...)` is what queues toasts (`toaster.create(...)`,
  `.success(...)`, `.error(...)`, `.warning(...)`, `.info(...)`); `Toaster` renders that store's
  live toasts through a render-prop `children`, one call per toast.
- **`toaster.promise(...)`** drives loading/success/error toasts automatically from a promise's own
  lifecycle — no manual `create`/`update` bookkeeping for the common "start an async action" case.
- **`toaster.update(id, ...)`** changes an existing toast in place (e.g. turning a `"loading"` toast
  into a `"success"` one) rather than creating a new one.
- **An optional action** — `toast.action` (`{ label, onClick }`) renders as `actionTrigger`, and
  clicking it dismisses the toast in addition to firing `onClick`.
- **Placement splits into three independent marks** — `data-placement` (all six values),
  `data-side` (`"top"`/`"bottom"` alone), and `data-align` (`"start"`/`"center"`/`"end"` alone) are
  three real, independently-selectable attributes derived from one `placement` value, not one
  folded into the others.
- **`data-type` is open-ended, not a closed set** — `"success"|"error"|"loading"|"info"|"warning"`
  are the well-known values with their own named states, but the real type is
  `... | (string & {})`: a consumer can pass any custom string as a toast's `type`, and it arrives
  on `data-type` faithfully. A skin rule keyed on the five named states won't catch a custom one.
- **Two opposite-polarity state pairs** — `first`/`sibling` (is this the frontmost toast in its
  group or not) and `stack`/`overlap` (are toasts in this group stacked or overlapping), the same
  device the avatar's `visible`/`hidden` uses: one boolean fact declared as two named states.
- **`placement` cannot be a kit setting** — it's configured once on the store
  (`createToaster({ placement })`), before any component instance exists to own it as a prop, and
  the name isn't part of the closed settings vocabulary (`orientation`/`multiple`/`collapsible`)
  regardless.
- **This kit doesn't use a `Portal` anywhere** — unlike Ark's own docs, which wrap every `Toaster`
  example in `<Portal>`, no component in this kit re-exports or requires one; `Toaster` renders in
  normal document flow here.

## Anatomy

```tsx
import {
  createToaster,
  Toaster,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastActionTrigger,
  ToastCloseTrigger,
} from "@omnifield/probe-web-ui";

// Call ONCE, at module scope — not inside a component body.
const toaster = createToaster({ placement: "bottom-end" });

<Toaster toaster={toaster}>
  {(toast) => (
    <ToastRoot>
      <ToastTitle>{toast().title}</ToastTitle>
      <ToastDescription>{toast().description}</ToastDescription>
      {toast().action && <ToastActionTrigger>{toast().action.label}</ToastActionTrigger>}
      <ToastCloseTrigger>✕</ToastCloseTrigger>
    </ToastRoot>
  )}
</Toaster>
```

`Toaster` draws `group`; `createToaster` is a factory function, not a component — there's no
`Toast`/root-level component to import for the anatomy's own `root`, only `ToastRoot`, which draws
one already-queued toast, not something you mount ahead of time.

## Examples

### Queuing a toast

```tsx
<button onClick={() => toaster.create({ title: "Scheduled", description: "Meeting set for 10am.", type: "info" })}>
  Schedule meeting
</button>
```

### Typed shortcuts

```tsx
toaster.success({ title: "Changes saved" });
toaster.error({ title: "Upload failed", description: "There was an error uploading your file." });
toaster.warning({ title: "Low storage" });
toaster.info({ title: "Update available" });
```

### Driven by a promise

```tsx
toaster.promise(uploadFile(), {
  loading: { title: "Uploading…" },
  success: { title: "Upload complete" },
  error: { title: "Upload failed" },
});
```

### Updating a toast in place

```tsx
const id = toaster.create({ title: "Sending…", type: "loading" });
// ...later, once the send resolves:
toaster.update(id, { title: "Sent", type: "success" });
```

### An action the toast offers

```tsx
toaster.create({
  title: "Event created",
  action: { label: "Undo", onClick: () => undoCreate() },
});
```

### A custom duration, or none at all

```tsx
toaster.create({ title: "Reminder set", duration: 5000 });
toaster.create({ title: "Stays until closed", duration: Infinity });
```

## Styling hooks

Every state in the tables above is a real selector (see `packages/skin`). One caveat the tables
can't carry: **Ark sets several CSS custom properties on `root` at runtime that this kit's passport
does not declare as variables** — `--x`/`--y` (position), `--scale`, `--z-index`, `--height`,
`--opacity`, and `--gap`, all documented on `ark-ui.com` as the "minimal styling required for the
toast to work correctly" (translate/scale/opacity driven by them). A skin needs at least
`translate: var(--x) var(--y); scale: var(--scale); opacity: var(--opacity);` on `root` for toasts
to appear positioned and animated at all — that requirement is real even though it doesn't show up
in this file's own CSS Variables table.

## Accessibility

Ark documents no dedicated WAI-ARIA widget pattern or keyboard table for Toast — it's a live-region
notification queue, not a focus-management widget; a toast doesn't take focus when it appears.
`hotkey` on the store (default `Alt+T`) moves focus into the toast group on demand, for a keyboard
user who wants to reach one.
<!-- user:end -->
