// Design notes: ../README.md#part

import { ancestorSelector, noWeight, partSelector } from "../../address/index.js";
import type { ComponentPassport } from "../../passport/form/index.js";
import type { PartStyle, PartStyles } from "../../recipe/index.js";
import { partVariables } from "../../variables/index.js";
import { growAncestor, growLocal } from "./local.js";
import type { Cursor, Variant, Walk } from "./state.js";

export function growPart<Mark>(
  passport: ComponentPassport,
  part: string,
  variant: Variant,
  origin: number,
  style: PartStyle,
  where: string,
  walk: Walk<Mark>,
): void {
  const own = partSelector(passport, part);

  if (own === undefined) {
    walk.flaws.add(
      "unknown-part",
      where,
      `component "${passport.component}" did not declare part "${part}": nothing to address`,
    );
    return;
  }

  const isRoot = part === passport.root;
  const ownVariantSelector = isRoot ? variant.selector : "";
  const rootVariantSelector = isRoot ? "" : variant.selector;
  const rootPrefix = rootVariantSelector === "" ? "" : ancestorSelector(passport, passport.root, [], rootVariantSelector);

  if (rootPrefix === undefined) {
    walk.flaws.add(
      "unknown-ancestor",
      where,
      `component "${passport.component}"'s root is not declared by the anatomy, and the variant ` +
        `name lives exactly there: part "${part}" has nothing to address a variant by`,
    );
    return;
  }

  const cursor: Cursor = {
    passport,
    part,
    known: new Set([...walk.known, ...partVariables(passport, part)]),
    own: own + ownVariantSelector,
    ...(variant.settings ? { settings: variant.settings } : {}),
    prefix: noWeight(rootPrefix),
    variants: variant.names,
    states: [],
    unreliable: [],
    conditions: 0,
    origin,
  };

  growLocal(cursor, style, where, walk);

  for (const [index, ancestor] of (style.ancestors ?? []).entries()) {
    growAncestor(cursor, ancestor, `${where}.ancestors[${index}]`, walk);
  }
}

export function growParts<Mark>(
  passport: ComponentPassport,
  variant: Variant,
  origin: number,
  parts: PartStyles,
  where: string,
  walk: Walk<Mark>,
): void {
  for (const [part, style] of Object.entries(parts)) {
    if (style === undefined) continue;

    growPart(passport, part, variant, origin, style, `${where}.${part}`, walk);
  }
}
