// Design notes: ./README.md#state

import { FORCE_ATTRIBUTE } from "../marks/index.js";
import type { ComponentPassport, PassportMark, PassportState } from "../passport/form/index.js";
import { partOf } from "../passport-view/index.js";
import { attribute } from "./scope.js";

export function markSelector(state: string, mark: PassportMark): string {
  if (mark.kind === "attribute") return attribute(mark.name, mark.value);

  return `:is(${mark.name}, [${FORCE_ATTRIBUTE}~="${state}"])`;
}

export function stateOf(passport: ComponentPassport, part: string, state: string): PassportState | undefined {
  return partOf(passport, part)?.states.find((declared) => declared.name === state);
}

export function stateSelector(passport: ComponentPassport, part: string, state: string): string | undefined {
  const declared = stateOf(passport, part, state);

  return declared === undefined ? undefined : markSelector(state, declared.mark);
}
