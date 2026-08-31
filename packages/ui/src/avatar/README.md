# Avatar

**Group:** other · **Genus:** component · **Footprint:** compact

## Anatomy

| part | meaning |
|---|---|
| root | the avatar as a whole — wraps the image and its fallback |
| image | the picture — a real `<img>`, kept in the DOM even while hidden so its load/error events still fire |
| fallback | shown while the image hasn't loaded (or has none) — initials, an icon, whatever the consumer puts inside it |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| image | visible | [data-state="visible"] | this part is the one currently showing |
| image | hidden | [data-state="hidden"] | the other part — image and fallback are never both visible or both hidden at once |
| fallback | visible | [data-state="visible"] | this part is the one currently showing |
| fallback | hidden | [data-state="hidden"] | the other part — image and fallback are never both visible or both hidden at once |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## Notes

<!-- user:start -->
## Overview

Avatar is a graphical stand-in for a person or entity — a picture, with a fallback shown while that
picture hasn't loaded or has none at all. It's the smallest composite component in the kit: three
parts, no settings, and exactly one fact that matters — did the image load.

## Features

- **Automatic image/fallback swap** — driven entirely by the real image load outcome, not a prop:
  whichever of `image`/`fallback` matches what actually happened is the one showing.
- **Fallback content is the consumer's choice** — initials, an icon, anything; the kit brings no
  default fallback graphic.
- **Image stays mounted while hidden** — `image` is a real `<img>` kept in the DOM even when
  `fallback` is showing, so its `load`/`error` events still fire and the swap can happen at all.
- **Load status observable from outside** — `onStatusChange` on the root reports the same
  loaded/error transition that drives `image`/`fallback`'s own states.
- **The wrapper carries no state of its own** — `root` has none; a skin styling "did this avatar's
  image load" has to select `image` or `fallback` directly; see `entity/passport.ts`.

## Anatomy

```tsx
import { Avatar, AvatarImage, AvatarFallback } from "@omnifield/probe-web-ui";

<Avatar>
  <AvatarFallback>{/* text or icon, shown while there's no loaded image */}</AvatarFallback>
  <AvatarImage src="..." alt="..." />
</Avatar>
```

`root` accepts only `image` and `fallback`, as siblings — order in the JSX doesn't matter, which one
paints on top is decided by `visible`/`hidden`, not by DOM order.

## Examples

### Basic, with an initials fallback

```tsx
<Avatar>
  <AvatarFallback>JD</AvatarFallback>
  <AvatarImage src="/jane-doe.jpg" alt="Jane Doe" />
</Avatar>
```

### An icon fallback instead of initials

`fallback` accepts icon content the same way it accepts text — there's no separate "icon fallback"
mode, just different children:

```tsx
<Avatar>
  <AvatarFallback>
    <UserIcon />
  </AvatarFallback>
  <AvatarImage src={user.avatarUrl} alt={user.name} />
</Avatar>
```

### Observing the load status

`onStatusChange` fires with `{ status: "loaded" | "error" }` exactly when the image finishes loading
or fails to — the same transition that flips `image`/`fallback`'s own `data-state`, for whenever
something outside the avatar needs to know too:

```tsx
import { createSignal } from "solid-js";

const [status, setStatus] = createSignal<"loaded" | "error">();

<Avatar onStatusChange={(details) => setStatus(details.status)}>
  <AvatarFallback>JD</AvatarFallback>
  <AvatarImage src="/jane-doe.jpg" alt="Jane Doe" />
</Avatar>
```

### No `src`, or one that fails to load

There's no prop that forces the fallback to show — it's simply what happens whenever `image` has no
`src`, or a `src` that fails to load. Both are realistic, not edge cases to special-case:

```tsx
<Avatar>
  <AvatarFallback>JD</AvatarFallback>
  <AvatarImage alt="Jane Doe" />
</Avatar>
```

## Styling hooks

`image` and `fallback` each carry `data-state="visible" | "hidden"` (see `packages/skin`) — and,
unusually for this kit, the two marks describe one shared fact from opposite sides: `image` is
`visible` exactly when `fallback` is `hidden`, and vice versa, always. There's no third "loading"
mark to style against — a skin that wants a loading look styles `fallback` while it's `visible`, the
same node a plain broken-image state would also show. `root` carries no state mark at all, only the
usual `data-variant` every part in the kit shares.

## Accessibility

Avatar isn't an interactive widget — it has no dedicated WAI-ARIA pattern or keyboard interactions,
being a static image rather than a control. The real accessibility surface is content, not
mechanics: `AvatarImage`'s `alt` is a native `<img>` attribute the kit does nothing special with, and
`AvatarFallback`'s content is what a screen reader (or a browser with images off) reads when the
picture never loads — worth writing something meaningful there (initials or a name), not leaving it
empty.
<!-- user:end -->
