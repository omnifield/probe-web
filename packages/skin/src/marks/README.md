# marks

Names by which generated CSS hooks into the document.

Each is declared HERE and exactly once: a literal scattered across call sites is a silent link that
survives a rename and starts lying (the same reason the values zone surfaced `BASE_MARKER`). They're
exported because FOREIGN mechanics use them: the editor sets the forced marker, the assembly
mechanic sets the node marker, the app toggles the dark pair.

Ours and foreign are of different quality here, and the difference is named honestly (`layers.ts`
vs. `foreign.ts`).

## Layers (`layers.ts`)

`SKIN_LAYER` — the cascade layer the SKIN sits in. A layer, not selector weight. The canon requires
a sketch edit to beat a skin, but weight comes out the other way: a coordinate gives two units
(`[data-scope][data-part]`), a node name gives one (`[data-node]`). Fixing this by weighting the
selector would settle a cascade question by how a record happens to be written: the next rule with
an extra attribute would silently break the order.

Layers settle this by construction: a rule from a later layer beats a rule from an earlier one
REGARDLESS of weight. Both generated texts declare the order on their very first line
(`LAYER_ORDER`), so it doesn't depend on which file got linked first.

Checked against the market 2026-08-20: cascade layers are baseline in every engine since March 2022
(Chrome/Edge 99, Firefox 97, Safari 15.4); the `@csstools/postcss-cascade-layers` polyfill exists and
is used in this zone's test suite as a CHECK, not as a shipped dependency.

`SKETCH_LAYER` — the cascade layer SKETCH EDITS sit in — rules addressed by node name. Declared
AFTER the skin, so it beats it at any selector weight.

`LAYER_ORDER` — layer order declaration, the first line of EVERY generated text (`../generate/`).
Repetition is harmless: the first declaration sets the order, later ones change nothing. That's
exactly why it's in both texts rather than one "main" one: they can be linked in any order and
separately, and the layer order must be the same regardless.

## Foreign (`foreign.ts`)

`FORCE_ATTRIBUTE` — FORCED STATE MARKER, what the preview uses to show a state that can't be set
through data. Three of a button's states are pseudo-classes: hover, active, keyboard focus. The
browser sets them, and the editor can't turn them on through an attribute or a prop. So the rule
also has to hook into a marker that CAN be set — and the SAME generator that ships the rule does
that.

Form: a list of names in one attribute (`data-force="hover active"`), matched via `~=`. One state,
one token; a node can be in several at once, and a second attribute for that wasn't needed. Names in
the list are STATE names from the passport (`hover`), not pseudo-classes (`:hover`): a state's name
survives a kit swap, markup doesn't (`button.anatomy.ts` declares exactly this).

`NODE_ATTRIBUTE` — the node marker in markup, what a SKETCH EDIT is addressed by.

A FOREIGN NAME. Set by the assembly mechanic at render time (`packages/assembly`, `render.tsx`),
pinned by a 2026-08-20 decision on the "Skin" page: "The name is pinned and must not change: from the
first saved sketch it becomes a key in the record."

It's recorded here second — a named gap, not a choice: the name has no single home. It would be
correct for the zone that SETS it to declare it and for us to import it; it doesn't expose it
outward, and patching a foreign zone isn't ours to do — raised to the architect.

SO THE DRIFT ISN'T SILENT, a seam test stands guard (`test/seams.test.tsx`): it renders a node with
the REAL assembly mechanic and asks whether our selector matches it. If the owner renames it, the
test goes red in the same run. Without it there would be no failure at all: the rule would just stop
firing, and the fix would go chasing the look.

`DARK_CLASS` — the dark-pair class on the document root.

A FOREIGN NAME, same as `NODE_ATTRIBUTE`. Declared and set by the `runtime` zone (`skin-root.ts`) and
the `style` zone (`palette.ts`); we need it because the canon requires a skin's value to follow the
mode: the dark pair is the skin's responsibility, not the value set's.

The light half is the ABSENCE of the class, not a second class. The selector takes both carrier
forms: the class can sit on the root itself or on an ancestor within it.

Drift is guarded by the same seam test: it dresses a skin with the REAL `runtime` switch —
`wear(name, { mode })`, one call — and asks whether the generated dark half hooks in. There's only
one door here: the half arrives together with the skin, the runtime has no separate mode knob at all.
