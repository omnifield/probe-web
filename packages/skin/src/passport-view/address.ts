// Design notes: ./README.md#address

import { PART, SCOPE, type PassportLookup } from "../address/index.js";
import { addressesView, type ComponentPassport, type PassportMark } from "../passport/form/index.js";
import { partOf } from "./part.js";

function holds(node: Element, mark: PassportMark): boolean {
  if (mark.kind === "pseudo") {
    return node.matches(mark.name);
  }

  return mark.value === undefined ? node.hasAttribute(mark.name) : node.getAttribute(mark.name) === mark.value;
}

export function addressOf(
  node: Element,
  lookup: PassportLookup,
): { passport: ComponentPassport; part: string } | undefined {
  const scope = node.getAttribute(SCOPE);
  const partAttr = node.getAttribute(PART);

  if (scope === null || partAttr === null) return undefined;

  const passport = lookup(scope);

  if (!passport) return undefined;

  const parts = passport.anatomy.build();
  const part = Object.keys(parts).find((key) => parts[key].attrs[PART] === partAttr);

  return part === undefined ? undefined : { passport, part };
}

export function statesOn(node: Element, passport: ComponentPassport, part: string): string[] {
  const declared = partOf(passport, part);

  return (declared?.states ?? [])
    .filter(addressesView)
    .filter((state) => holds(node, state.mark))
    .map((s) => s.name);
}
