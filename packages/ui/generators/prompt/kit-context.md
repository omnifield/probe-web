<!--
Заметки для агента, ведёт user. Один файл на ВЕСЬ кит, попадает в КАЖДЫЙ промпт целиком —
единственное место, где стоит писать факты, общие для всех компонентов сразу (что за кит,
глоссарий терминов, на чём стоит). Факты ОДНОГО компонента сюда не идут — они уже есть в данных
(`passport`/`editorInfo`) и в реальном исходнике (`components/kit.tsx`), которые промпт получает
отдельно, по каждому компоненту свои.

Первый реальный проход (2026-08-30): наполнено тем, что архитектор уже знает из разбора кита, а не
тем, чего агенту не хватило — прогона ещё не было. Править по фидбеку после первого теста.
-->

# probe-web UI kit — context for the writing agent

## What this is

SolidJS component primitives (package `@omnifield/probe-web-ui`), built on top of
[Ark UI](https://ark-ui.com) (`@ark-ui/solid`, itself a thin wrapper over
[Zag.js](https://zagjs.com) state machines). **This is SolidJS, not React** — no hooks, no
`useState`, props stay as reactive accessors, don't destructure props in the component body the
way React code would.

The kit ships **zero default styling**. Every component is structure, accessibility (WAI-ARIA),
and behavior only — no CSS, no color, no spacing, no animation, no icon graphic. Visual appearance
is a separate concern, applied later by a "skin" (see below). Do not invent styling, colors, or
animation in the docs — say what the node looks like structurally, not visually.

## The wider framework — where this kit fits

You don't need to go read these to write a competent page (the passport JSON + editor info +
component source below already carry this component's own facts), but they explain the SYSTEM
this component lives in — open one when you need to describe how something connects beyond this
one file, rather than guessing. Paths are relative to the repo root.

- **`packages/skin`** (`packages/skin/README.md`) — the mechanism that turns this component's
  passport into real CSS. It never touches the kit's code; it reads the passport's parts/states/
  settings and generates selectors like `[data-scope="accordion"][data-part="item"][data-state="open"]`
  from them. A state's or setting's `mark` (attribute or pseudo-class, in the passport JSON below)
  is exactly the hook this mechanism turns into a selector — that's the whole reason marks exist.
  If you want to say something like "the skin styles this via its `mark`", this is the package
  that does it; don't describe HOW it generates CSS (cascade, tokens, recipes) beyond that, it's
  a different concern from this component's own docs.
- **`packages/assembly`** (`packages/assembly/README.md`) — a tree-of-instances engine
  (`RenderTree`) for composing REAL, data-driven trees of components — used by the visual editor/
  showcase (and by any page whose structure is genuinely JSON: saved, edited by a non-technical
  person, or sent over the network). `playground/assemblies/*.ts` next to this component's own
  entity/components folders are worked EXAMPLE instances built this way — useful as a secondary
  reference for realistic data shapes, but the PRIMARY usage pattern to document is plain SolidJS
  JSX composition (what `components/kit.tsx` shows), not this tree format — most consumers never
  touch `RenderTree` at all. The passport's `accepts` field (inside `editorInfoJson` below) is this
  mechanism's nesting rule: what may legally go inside each part.
- **`packages/io`** (`packages/io/README.md`) — a component's own DATA shape (what an assembly's
  `bind` paths point into), kept deliberately separate from the passport/skin. Not usually
  something you need to explain in a component's docs unless the component ships a data-shaped
  example.
- **`packages/style`** (`packages/style/README.md`) — a design-TOKEN contract (color/spacing/
  radius scales etc.) that a skin MAY draw values from. It's one optional supplier among possible
  others, never a dependency of this kit. Don't imply the kit uses specific tokens or colors.
- **This component's own `playground/recipe.ts`** (if you happen to see it) is a TEST FIXTURE
  proving skin coverage — it never ships, and is not the component's real look. Ignore it as a
  styling reference.

## How a consumer imports and uses a component

Everything ships from **one root entry point**, no per-component subpath:

```tsx
import { Accordion, AccordionItem, AccordionItemTrigger, AccordionItemContent } from "@omnifield/probe-web-ui";
```

Compose the parts as plain SolidJS JSX. The "Component source" section below is the REAL
implementation file for this component — copy real prop names, real JSDoc `@example` blocks, and
real composition/nesting from there. Do not invent a prop, a part, or a way of nesting parts that
isn't visible in that source or in the passport data.

**The source's own JSDoc `@example` can itself be stale — it is prose, never typechecked.** Found
live on `button` (2026-08-30): its JSDoc showed `<Button variant="primary">`, a prop that does not
exist — the real mechanism is the attribute `data-variant`, proven by the component's own test
file. Trusting the source over the JSON (as instructed above) means trusting what it PROVES, not
copying prose uncritically. **Before shipping any code snippet, satisfy yourself it would actually
compile** — check the real prop names/types in the source file, and prefer whatever a component's
own `*.test.tsx` asserts over a comment or a JSDoc example when they disagree, since tests run and
prose doesn't. If you find the source's JSDoc itself is wrong, fix the JSDoc in the source file,
not just your own doc page — `prompt.mjs` embeds this file verbatim into every future run of this
same prompt, so a stale example there keeps misleading the next writer too.

**Composition idiom is not one fixed pattern — it differs by which provider a component stands
on**, and guessing it from a comment or from another component's docs is exactly how the `button`
mistake above happened a second way (a composition example copied a direction that didn't
typecheck either). Kobalte-based primitives (most of the kit today) compose via the polymorphic
`as` prop — the INNER kit component takes the outer one as `as`, e.g.
`<Button as={ToggleGroupItem}>`. Ark-based primitives (the components actively migrating to Ark,
named in `packages/ui/README.md`'s own migration note) compose differently, via `asChild={(props)
=> <Inner {...props()}>}`. Check which one the actual component you're documenting uses by reading
its source, and typecheck the composition example before shipping it.

## The passport: the kit's own vocabulary

Every component declares a "passport" (`entity/passport.ts`) — the one true runtime contract you
are given as JSON below:

- **parts** — the anatomy: which DOM nodes exist (e.g. `root`, `item`, `itemTrigger`). Note
  `passport.anatomy` itself serializes as `{}` in the JSON — that's expected (it's a Zag builder
  object, not plain data), not a gap: the actual part list is `passport.parts`, and which part can
  nest inside which is `editorInfo.parts[name].accepts` (see below).
- **states** — per-part conditions that can be true at once (e.g. `open`, `disabled`, `focus`),
  each carrying a **mark**: the real DOM signal a skin (or a reader inspecting the page) can
  observe — either an attribute (`[data-state="open"]`, `[data-disabled]`) or a pseudo-class
  (`:hover`, `:focus-visible`, `:active`, `:disabled`). A state marked "may be absent" means the
  mark sometimes never arrives at all (e.g. a no-animation transition can skip `data-state`
  entirely) — carry that caveat into the docs verbatim, don't silently promise the mark is always
  there.
- **settings** — component-level configuration that shapes behavior (e.g. `orientation`,
  `multiple`), each with a default value and, sometimes, `dependsOn` another setting — meaning it
  only has an effect when that other setting holds a particular value. Say so explicitly when it
  applies.
- **variantAxis** — the free-text "look" a human names in the visual editor; the kit itself only
  passes it through, it doesn't interpret it.

`editorInfo.parts[name].accepts` is the nesting rule: what may legally go inside that part —
another named part (`{kind:"component", name:"item"}`), a reference to any independently-addressed
component (`{kind:"component"}`, no name — the consumer's choice), or plain content
(`{kind:"content", genus:"text"|"icon"}`). Use it to describe composition correctly — which parts
wrap which — instead of guessing from the flat part list.

`genus` distinguishes a real UI **component** from a bare **icon** registry entry — every actual
component you're documenting has `genus: "component"`. `group` is the catalog category (Actions,
Inputs, Navigation, Overlays, Disclosure, Feedback, Layout, Other) — useful for framing what kind
of thing this is at the top of the page. `footprint` (`compact`/`regular`/`wide`) is a rough sizing
hint for how much horizontal room the component wants — mention it only if relevant, don't dwell on
it.

## Two data sources you're given, and why they can disagree

- **Passport** — the machine truth: exactly what DOM structure, states, and settings really exist
  at runtime.
- **Editor info** (the `means` fields) — a human's plain-language explanation of what each part,
  state, or setting is FOR. It can be the literal placeholder `"TODO"` when nobody has written the
  explanation yet. **Never invent a meaning to fill a `TODO`.** Write the anatomy/states/settings
  section truthfully from the passport data and the real source alone (part names, marks,
  defaults, actual props); leave out the human explanation for that one row rather than guessing at
  it, and don't let one missing `means` block the rest of the page.

## What NOT to do

- Don't invent props, parts, states, settings, or defaults that aren't in the data or the source
  file — every factual claim must be traceable to one of the three inputs you're given.
- Don't write React idioms — this is SolidJS.
- Don't invent visual styling, colors, sizes, or animation — the kit ships none by default.
- Don't invent an icon or graphic inside an indicator/trigger unless the source explicitly renders
  one — the kit usually leaves that slot to the consumer.

## Where the result goes

Your prose is not the whole file — it lands inside the existing generated `README.md` for this
component, between `<!-- user:start -->` and `<!-- user:end -->` markers (see the Task section).
Everything outside those markers (anatomy/states/settings tables) is already generated
mechanically from the same passport/editor data — don't repeat those tables in prose, write the
explanation and real usage examples that the tables can't carry.
