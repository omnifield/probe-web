import { readFileSync } from "node:fs";

import Handlebars from "handlebars";

/**
 * `noEscape: true` because generated output is TypeScript/Markdown/etc.,
 * not HTML — Handlebars' default HTML-escaping would mangle quotes and
 * angle brackets. `strict: true` so a typo'd field name in the template
 * throws instead of silently rendering as an empty string.
 */
function compileTemplate<TContext>(templatePath: string): (context: TContext) => string {
  const source = readFileSync(templatePath, "utf8");
  const template = Handlebars.compile<TContext>(source, { noEscape: true, strict: true });
  return (context) => template(context);
}

/**
 * Turns a Handlebars template file into an `AggregatePlugin.render` function: the
 * file is read and compiled once, and every call renders it against
 * `{ items }` — the array of ALL collected items, since an aggregate plugin
 * produces one file built from every entry (`{{#each items}}`). This is
 * what lets a caller pass a template FILE instead of writing a render
 * function by hand — the template owns the text, `collect` owns the data.
 */
export function fromTemplate<TItem>(templatePath: string): (items: readonly TItem[]) => string {
  const render = compileTemplate<{ items: readonly TItem[] }>(templatePath);
  return (items) => render({ items });
}

/**
 * The `PerEntryPlugin.render` counterpart of `fromTemplate`: a per-entry
 * plugin renders ONE file from ONE collected item, not an array of all of
 * them, so the item's own fields ARE the template's top-level context — no
 * `{ items }` wrapper, no `{{#each}}` needed to reach a single record's
 * fields.
 */
export function fromEntryTemplate<TItem extends object>(templatePath: string): (item: TItem) => string {
  return compileTemplate<TItem>(templatePath);
}
