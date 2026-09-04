# model.ts

The `./model` subpath — the skin mechanic WITHOUT generation: model, addressing, rule assembly,
checks.

A separate entry, not a slice of the shared one, because this half has a different consumer: skin
storage, saved-record validation, and the editor while "a human is still editing" need the form and
the refusals, and have nothing to print and no need to.

The reverse doesn't hold: generation stands on the model, so the root entry (`index.ts`) hands it
out too.

Neither of these entries pulls in postcss — that lives behind a third one, `flatten/` (`PWEB-36`).

**Why this file stays flat, not a folder.** It's a build entry point named by exact path in
`vite.config.ts` (`{ name: "model", source: "src/model.ts" }`) and mirrored by `package.json`'s
`exports["./model"]`. `tsc`'s declaration emission mirrors the source tree literally — a
`src/model/index.ts` would emit `dist/model/index.d.ts`, not the `dist/model.d.ts` the manifest
promises, breaking every consumer's types. Verified by trying it: `packages/ui` and `apps/skin`
both went red. Everything else in this package is a folder; these four (`index.ts`, `model.ts`,
`editor.ts`, `flat.ts`) can't be, for this one mechanical reason.

## Passport form (`PWEB-110`, revisits `PWEB-26`)

Physically moved here: it's shared by any component provider, not a privilege of one particular
kit. Rationale for the criterion, and what did NOT move (`PASSPORTS`, `passportOf` — THIS kit's
registry and registry reader, stayed in `@web-core/ui/passport`) — in
`passport/form/README.md`.

Exported through the same subpath as always: a registry holder (a kit, a product package with its
own table) declares its passports with these types and this function, not its own copy of the form.

Only the RUNTIME slice (`PWEB-115`) lives here: what `generateSkinCss`/`checkOutfit`/`assemble`
actually read. Genus, group, package, the nesting rule, assemblies, and every `means` are the EDITOR
slice, the `./editor` subpath, and are not physically re-exported here: letting them pass this
boundary too would leave it a promise, not a property of the modules.

## Passport reader under look (`PWEB-27`)

The bridge from a live node to a skin coordinate, also shared by any provider.

## Self-assembly (`PWEB-167`/`PWEB-168`)

The node vocabulary it's built from is a RUNTIME slice, unlike the showcase-facing
`PassportAssembly`/`DataPreset` (those carry `means` and scenario names, stay editor-only,
`./editor`). A reference to a component from someone else's tree unfolds THIS tree at render time,
so the render mechanic needs these types reachable without pulling in the editor slice.

## `passportLookup`

Exported through the SAME entry as its type (`PWEB-95`): there is one place that builds the map, and
declaring that in a comment without handing out the builder itself would require every registry
holder to write its own map — exactly what's forbidden. A registry holder now binds the mechanic in
two steps: `withPassports(passportLookup(PASSPORTS))`.

## The passport source is named once (`PWEB-94`)

Skin, sketch-edit, and outfit checks all arrive bound, and there are no free-standing signatures
with a source argument left on the surface: while they existed, the signature allowed checking with
one source and generating with another. Rationale — `bound/README.md`.

## The "look vs. motion" boundary (`PWEB-99`)

Exported for the same reason as the fluid-ban kind: the editor must tell a human IN ADVANCE what's
legal under an unreliable marker, and parsing a refusal string for that isn't its job. The zone's
decision is named in one place (`motion/`), and this is only its door.

## Skin values

Building from seeds, and how a human's edit gets marked. Lives in `./model` because it's the MODEL
— name checking, generation, and readability all depend on it. The cost is named: scale building is
taken from the values zone, and it arrives here as a peer.

## Size scales

The second row of seeded values. Exported because the editor and storage ask the same thing
generation does: which seeds are legal, and what the skin actually declares.

## Fluid size (`PWEB-80`)

A seed is declared by poles, the mechanic prints the expression. Exported because everyone asks: the
editor shows a human the edges, storage validates the record, tests verify the computed value.

## Look splits into three (`PWEB-78`)

Palette, form, outfit — records assembled AT DRESSING TIME. `Skin` isn't removed by this: it became
what assembly PRODUCES. Rationale — `look/README.md`.

## The vocabulary

The machine contract between the three records. Exported because everyone asks it: the editor lists
roles for a human, storage rejects an incomplete palette, tests verify.
