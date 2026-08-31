// Design notes: ./README.md#part

import type { ComponentPassport } from "../passport/form/index.js";
import { attribute } from "./scope.js";

export function partSelector(passport: ComponentPassport, part: string): string | undefined {
  const attrs = passport.anatomy.build()[part]?.attrs;
  if (!attrs) return undefined;

  return Object.entries(attrs)
    .map(([name, value]) => attribute(name, value))
    .join("");
}

export function componentSelector(passport: ComponentPassport): string | undefined {
  const attrs = passport.anatomy.build()[passport.root]?.attrs;
  if (!attrs) return undefined;

  const pair = Object.entries(attrs).find(([, value]) => value === passport.component);

  return pair ? attribute(pair[0], pair[1]) : undefined;
}
