# scaffold tests

`generate.test.ts` — pure, per-entry rendering in isolation, no filesystem.
`run.test.ts` — the whole pipeline against a real temporary directory tree,
including the all-or-nothing write guarantee: a `validate` failure on any
one entry leaves no file written for any entry, not a half-finished batch.
