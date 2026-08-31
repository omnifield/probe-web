# bound

Binding to the passport source — half of the model (`PWEB-94`).

## What this closes off

Outfit checking and generation must go to ONE source of passports. While the source was an argument
to EVERY call, the signature allowed checking with one and generating with another:

```
assemble(outfit, parts, passportOf)       ← source named here
generateSkinCss(skin, passportOf)         ← and again here
```

They matched by agreement, and a comment held that agreement together. A completely foreign source
fails loudly (`unknown-component`), but two sources equally complete BY NAME, yet different in
anatomy or declared variables, drift silently: the check approves a variable against one anatomy,
generation addresses it against another — and the page ends up with a rule targeting attributes that
aren't there. A look with no look, and not a single flaw in the report.

Here the source is named ONCE, and there is nothing left to drift: bound calls have no argument for
a second source — not by agreement, but by signature.

## Why the SOURCE is bound, not the record

The obvious alternative: let `Assembled` carry its own source, and generation accept `Assembled`.
That form is rejected by a consumer survey: `apps/reference` and the dev console hold a BARE `Skin`
— one hand-written, the other arriving from the preset service — and they have no outfit and
shouldn't. Requiring `Assembled` would make them invent an outfit just for the signature, or get a
`Skin → Assembled` loophole — exactly the second path this exists to close.

## Why the binding lives in two places, and why it's ONE binding

This is half of the model. The other half (`../generate/`) is the same binding plus printing, and
it's assembled FROM this one, not written alongside it. The same relationship already declared
between the package's entry points: the root is `./model` plus generation. Setting up two
independent binders would let their contents drift apart, and "one door" would become two.

## A gap, named out loud

Two DIFFERENT bindings in one file (`withPassports(a).assemble(…)` followed by
`withPassports(b).generateSkinCss(…)`) will compile: TypeScript gives no per-instance nominal typing
here. But the source in such code is named twice and visible in the line — and the requirement is
exactly that: name it once.

## Index (`index.ts`)

`BoundModel` — exactly what the `./model` subpath used to hand out as free-standing signatures,
minus the source argument on each one. `assemble` throws `OutfitRefused` on a flaw.

`withPassports` binds the model mechanic to a passport source:

```ts
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { withPassports } from "@omnifield/probe-web-skin/model";

const { assemble, checkSkin } = withPassports(passportOf);
const { skin, report } = assemble(outfit, parts);
```

`lookup` — how to find a passport by component name — the ONLY place the source is named.
