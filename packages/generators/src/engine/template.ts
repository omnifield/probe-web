import { readFileSync } from "node:fs";

import Handlebars from "handlebars";

function compileTemplate<TContext>(templatePath: string): (context: TContext) => string {
  const source = readFileSync(templatePath, "utf8");
  const template = Handlebars.compile<TContext>(source, { noEscape: true, strict: true });
  return (context) => template(context);
}

export function fromTemplate<TItem>(templatePath: string): (items: readonly TItem[]) => string {
  const render = compileTemplate<{ items: readonly TItem[] }>(templatePath);
  return (items) => render({ items });
}

export function fromEntryTemplate<TItem extends object>(templatePath: string): (item: TItem) => string {
  return compileTemplate<TItem>(templatePath);
}
