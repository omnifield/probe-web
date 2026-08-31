# flatten

Unwraps nested CSS into flat CSS — the `../flat.ts` subpath.

## Why a separate subpath, not a generator option

Unwrapping is backed by postcss and its dependents, and they land in the consumer's bundle from the
mere IMPORT — regardless of whether they're ever called. A `{ form: "flat" }` option on the shared
function would leave them in everyone's chain, i.e. solve nothing: measured that the showcase with
them weighs 257.06 KB, and it generates CSS on every knob turn.

A separate entry point solves this by construction, not by promise: whoever never imports
`../flat.ts` has nowhere for postcss to come from in their bundle. Verified by a surface test against
the BUILT file.

## Why the flat form is needed at all

CSS nesting is Baseline Widely Available since June 11, 2026, 94.1% coverage. Ninety-four percent is
not a hundred: an old client remains. Plus a file headed to disk, and a snapshot diff, where flat
text reads line by line for a human.

So the flat form isn't dropped — it's moved to where it's actually needed.

## Both forms describe one look

Not a single line here knows about a skin, a coordinate, or a passport: text in, text out. No second
generator is set up — recipe assembly is one (`../rules/`), printing is one (`../generate/`), and
this transform sits AFTER both. The forms' agreement is verified by comparison after unwrapping, not
by intent.

## Index (`index.ts`)

`flattenCss` — accepts any CSS, not just ours: the subject here is the record's form, not its
origin. `root` is available synchronously off the sync pipeline; indentation is fixed by walking the
tree, not the string — a regex over CSS trips on the first value with parentheses. Pipeline built
once: recreating it on every call would be pointless.

## Format (`format.ts`)

Indentation of generated text.

### Why this lives here, not in the unwrapper

Nested unwrapping is done by `postcss-nested` — the same tool that does the unwrapping and that
Panda itself is built on. It doesn't fix indentation: a node moved to the top level carries its
indent from its old place, and the text comes out ragged, with no blank line between rules. A human
reads this file — in devtools and by eye, when checking exactly what a node is wearing.

### What was replaced here, and what was verified in the process

Before 2026-08-20, unwrapping and indentation were done by `expandNestedCss` from `@pandacss/core`.
Dropping that package was a decision about WEIGHT (9.0 MB / 33 packages vs. 1.1 MB / 8), and inside
it sat exactly `postcss([nested(), prettify()])`: the same unwrap tool plus about fifteen lines of
indentation. Those fifteen lines are what got replaced.

**The CSS did not change from the swap, and that's verified by machine:** the same 23 rules, the
same selectors, the same order, text matching after normalizing whitespace and trailing semicolons.
INDENTATION changed — and for the better:

- Panda's indentation pass is registered in the SAME pipeline as unwrapping and runs BEFORE nested
  blocks get hoisted to the top level. A hoisted block carried its indent from its old place, and
  `@media` came out misaligned. Our pass runs after unwrapping.
- The closing brace and trailing semicolon were never fixed by Panda at all, so a block opened at
  one level and closed at another. Half-fixed indentation is worse than none: it reads as a
  generation bug.

The form is pinned by a SNAPSHOT from here on (`test/__snapshots__/*.css`): the next output edit
arrives to a human as a review diff, not as silence.

`indent` — a blank line is placed only between children of a NON-rule — that is, between rules and
blocks, not between declarations inside a rule: a sparse property list is harder to read than a
dense one. An already-written indent is respected in exactly one case: if it holds something other
than whitespace. Empty, whitespace-only, and multi-line ones get rewritten. The closing brace sits
at the same level as the opening one, fixed via a separate field: in postcss the indent before `}` is
not "the last child's indent" but the host's own indent. The last declaration in a block also gets a
trailing semicolon: hoisted blocks lose theirs, and the file comes out inconsistent otherwise.

`prettify` — the very first node should have no indent: the file doesn't start with a blank line.
The file ends with a newline, and exactly one.
