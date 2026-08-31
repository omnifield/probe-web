# extract tests

`fixtures/` mimics the shape that matters: `consumer.ts` imports a sibling
via a `.js`-extension specifier pointing at `value.ts` (the convention
`importModule` exists to resolve), and builds a value through a function
that computes something beyond its raw input — proving the result is the
real executed output, not text lifted from the source.
