# property

Property name in two spellings — one place of translation for the whole zone. The recipe form is
written camelCase (`borderWidth`), CSS understands kebab-case (`border-width`), and we accept both.
Two readers depend on this translation — printing (`../generate/`) and the contrast count
(`../contrast/`) — and a second spelling of it would drift from the first on the very next edge
case.

`cssProperty` — property name in CSS spelling. Custom properties are left untouched: `--my-name` is
already a name, not a record — kebab-case passes through unchanged since it has no capitals.
