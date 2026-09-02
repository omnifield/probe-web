# vocabulary

VOCABULARY — the machine contract between a palette, a form, and an outfit.

## Why this exists at all

Components arrive from DIFFERENT providers: the button and layout from the framework, tables from
one product, filters from another. A component provider does not write the look — it declares a
passport, and its involvement ends there.

Twenty providers and ten editors will not agree on anything except a CHECKABLE contract. The
vocabulary IS that contract, and it gives exactly three things:

- a form cannot ask for a role that is not in the vocabulary;
- a palette cannot declare a role that is not in the vocabulary;
- a palette that has not closed the vocabulary is INCOMPLETE, and that is named BEFORE dressing.

Without the third point, a form written for one palette would land on another and silently lose
part of its values: the rule would still exist, `var()` would not resolve, and the fix would go
chasing the look.

## Roles are named BY PURPOSE, not by taste

`accent`, `success`, `danger` are WHAT a color does, not what it looks like. Taste lives in the seed
a palette provides — re-seed it, the look changes, the roles stay the same. This is the exact same
move the values zone makes when it declares step PURPOSE (`STEP_PURPOSE`) without declaring the
colors themselves.

**The list of scale roles is the contract's BREAKING part.** Add a role — every existing palette
becomes incomplete; remove one — every form addressing it becomes invalid. That is exactly what
happened: success and warning arrived as a separate decision (`PWEB-79`), and palettes built for
three scales started being rejected before dressing. That is working as intended — incompleteness is
NAMED, not swallowed.

So there are exactly as many roles here as it takes to dress the UI, and not one "for later".

## What is NOT in the vocabulary, and why

**`--control-target-min`.** A normative threshold (WCAG 2.2, 2.5.8), not taste: were it a role, a
palette could "adjust" it, i.e. move the norm with a look record. Control height is taken as a step
instead.

**The layer scale (`--z-*`).** A contract of components coexisting: a skin that reorders it breaks
function, not appearance. There is no second legitimate answer there, so there is no role either.

## Motion row names are declared HERE, and this is not a second source of truth

The values zone keeps durations and curves as literals inside its own sheet and does not hand them
out as data (a request for that is open). Copying the VALUES from there would make this a second
source of truth — which is exactly why they are not here. Only the NAMES live here (`rows.ts`), and
a role's name is the actual subject of the contract: how long a fast transition lasts is the
palette's call; what that role is called is the vocabulary's.

## Role (`role.ts`)

`RoleKind` — where a role's value comes from and what checks it. `Role` — a vocabulary role: its
name without `--`, and its kind.

## Scale roles (`scale-roles.ts`)

`SCALE_ROLES` — COLOR SCALE ROLES, by purpose, not by taste. Five, and each is named by what it does:

- `accent` — what the app uses to show its primary action and itself;
- `neutral` — surfaces, text, borders: everything else sits on it;
- `danger` — a destructive action, with its own contrast and its own purpose;
- `success` — something completed: saved, sent, a check passed;
- `warning` — something that needs attention but destroys nothing.

Keeping them separate is mandatory: fold two intents into one scale, and "delete" becomes a shade of
the primary action, with contrast promises counted on one ladder for two different meanings.

**Why five, not three (`PWEB-79`).** The same argument that split accent from danger keeps going:
"saved" and "delete" are DIFFERENT intents, not different flavors of one, and their contrast promises
are their own. The constraint here is not cosmetic. The vocabulary is CLOSED, and a palette cannot
declare a role that is not in it — so an author who needs a green "saved" writes it as a LITERAL,
i.e. around the contract. Three roles would undo exactly what the vocabulary exists for.

**There is no sixth role "for later", and that is a decision too.** A blue intent almost always
coincides with the accent, and a sixth scale only pays for itself once the accent stops being blue.
It would then arrive as a FACT, not ahead of time: a role declared "for later" obligates every
palette to close something nobody uses.

`STEPS` — steps of a color scale: twelve solid ones plus the one contrasting against the solid. The
list is taken from the values zone (`SCALE_STEPS`), not written here: a second list would drift from
the first on the very next ladder edit, and whichever was consulted last would end up "right".

`colorStepPurpose` — the reverse lookup: full variable name (`--accent-9`) to its purpose class (`fill`
or `ink`, from the values zone's `STEP_PURPOSE_CLASS`). Built off the SAME `SCALE_ROLES` × `STEPS`
cross product as `VOCABULARY` below, on purpose — a second cross product would know a different set of
names than the one the vocabulary actually closes. Feeds `../rules/step-purpose.ts`; a name that is
not a color-scale step at all returns `undefined`, read as "nothing to check", not "anything goes".

## Rows (`rows.ts`)

`ROWS` — rows without a seed: ratios, weights, and motion. A palette gives the values, the vocabulary
the names.

## Index (`index.ts`)

`VOCABULARY` — every role a palette must close and a form is allowed to address. Assembled from
data, not written out by hand: color roles are the scale roles crossed with the values zone's own
steps; size roles are its own seeds and derived steps; rows are its own normalized list plus motion
names. Writing it out by hand would let it drift from its sources silently.

`ROLE_NAMES` — vocabulary names as the same list, but for a fast membership check.

`knownRole` — is this role in the vocabulary. The name is accepted in either spelling — `accent-9`
and `--accent-9`.
