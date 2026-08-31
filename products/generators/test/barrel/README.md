# barrel tests

Mirrors `src/barrel/` one file at a time: `scan.test.ts`, `identifier.test.ts`,
`generate.test.ts`, and `write.test.ts` each test one module in isolation.
`run.test.ts` is the only one that exercises the whole pipeline together,
against a real temporary directory tree.
