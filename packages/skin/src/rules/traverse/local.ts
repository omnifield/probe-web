// Design notes: ../README.md#local

import { ancestorSelector, markSelector, stateOf } from "../../address/index.js";
import { addressesView } from "../../passport/form/index.js";
import type { AncestorStyle, LocalStyle } from "../../recipe/index.js";
import { checkStyle } from "../check-value.js";
import { checkMotionOnly } from "../check-motion.js";
import { declares, type Cursor, type Walk } from "./state.js";

export function growLocal<Mark>(cursor: Cursor, style: LocalStyle, where: string, walk: Walk<Mark>): void {
  if (style.props && declares(style.props)) {
    checkStyle(style.props, `${where}.props`, cursor.known, walk.flaws, walk.homes);
    checkMotionOnly(style.props, `${where}.props`, cursor, walk.flaws);
    walk.out.push({
      ...walk.mark(cursor),
      selector: cursor.prefix === "" ? cursor.own : `${cursor.prefix} ${cursor.own}`,
      style: style.props,
      conditions: cursor.conditions,
      origin: cursor.origin,
    });
  }

  for (const [state, nested] of Object.entries(style.states ?? {})) {
    const declared = stateOf(cursor.passport, cursor.part, state);

    if (declared === undefined) {
      walk.flaws.add(
        "unknown-state",
        `${where}.states.${state}`,
        `part "${cursor.part}" of component "${cursor.passport.component}" did not declare this ` +
          "state. A rule addressing an undeclared state is invalid",
      );
      continue;
    }

    growLocal(
      {
        ...cursor,
        own: cursor.own + markSelector(state, declared.mark),
        states: [...cursor.states, state],
        unreliable: addressesView(declared)
          ? cursor.unreliable
          : [...cursor.unreliable, { component: cursor.passport.component, part: cursor.part, state: declared }],
        conditions: cursor.conditions + 1,
      },
      nested,
      `${where}.states.${state}`,
      walk,
    );
  }
}

export function growAncestor<Mark>(cursor: Cursor, ancestor: AncestorStyle, where: string, walk: Walk<Mark>): void {
  const owner = walk.lookup(ancestor.component);
  const prefix = owner && ancestorSelector(owner, ancestor.part, ancestor.states);

  if (!owner || !prefix) {
    walk.flaws.add(
      "unknown-ancestor",
      where,
      `ancestor "${ancestor.component}.${ancestor.part}" is not declared: no passport, no part, ` +
        "or one of the named states is missing",
    );
    return;
  }

  const unreliable = (ancestor.states ?? []).flatMap((state) => {
    const declared = stateOf(owner, ancestor.part, state);

    return declared && !addressesView(declared)
      ? [{ component: ancestor.component, part: ancestor.part, state: declared }]
      : [];
  });

  growLocal(
    {
      ...cursor,
      prefix: cursor.prefix === "" ? prefix : `${cursor.prefix} ${prefix}`,
      unreliable: [...cursor.unreliable, ...unreliable],
      ancestor: {
        component: ancestor.component,
        part: ancestor.part,
        states: ancestor.states ?? [],
      },
      conditions: cursor.conditions + (ancestor.states?.length ?? 0),
    },
    ancestor.style,
    `${where}.style`,
    walk,
  );
}
