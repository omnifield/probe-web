// Design notes: ./README.md

import type { PassportLookup } from "../address/index.js";
import { addressOf, statesOn } from "./address.js";
import type { SkinAncestor, SkinCoordinate } from "./types.js";

export type { SkinAncestor, SkinCoordinate } from "./types.js";
export { partOf } from "./part.js";

export function coordinateOf(node: Element, lookup: PassportLookup): SkinCoordinate | undefined {
  const address = addressOf(node, lookup);

  if (!address) return undefined;

  const { passport, part } = address;
  const axis = passport.variantAxis.mark;
  const variant = axis.kind === "attribute" ? (node.getAttribute(axis.name) ?? undefined) : undefined;

  return {
    component: passport.component,
    part,
    states: statesOn(node, passport, part),
    ...(variant === undefined ? {} : { variant }),
    ...(ancestorOf(node, lookup) ?? {}),
  };
}

function ancestorOf(node: Element, lookup: PassportLookup): { ancestor: SkinAncestor } | undefined {
  for (let owner = node.parentElement; owner; owner = owner.parentElement) {
    const address = addressOf(owner, lookup);

    if (!address) continue;

    return {
      ancestor: {
        component: address.passport.component,
        part: address.part,
        states: statesOn(owner, address.passport, address.part),
      },
    };
  }

  return undefined;
}
