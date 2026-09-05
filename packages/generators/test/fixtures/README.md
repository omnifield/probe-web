# fixtures

Real component data, copied in — not synthetic. `accordion/entity/` is an
unedited copy of `packages/ui/src/accordion/entity/` (2026-08-30): the real
`passport.ts`/`anatomy.ts`/`io.ts`/`index.ts`, kept isolated here so testing
`extract`/`plugin` against a realistic component does not depend on files a
live component-kit session is actively editing.

Only `entity/` is copied, not the whole component: `components/`,
`playground/`, `test/` need Solid/Ark/Kobalte to even parse (JSX), and carry
nothing `extract` cares about — `passport.ts`'s one reference to them
(`import type { AccordionProps } from "../components/index.js"`) is
type-only and is erased before resolution is ever attempted (checked: the
fixture works without that file existing at all).
