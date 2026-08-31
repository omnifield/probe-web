// Design notes: ./README.md#home

import type { PassportLookup } from "../address/index.js";
import type { ComponentPassport } from "../passport/form/index.js";

export interface VariableHome {
  readonly component: string;
  readonly part: string;
  readonly setBy: string;
}

export function property(name: string): string {
  return name.startsWith("--") ? name : `--${name}`;
}

export function partVariables(passport: ComponentPassport, part: string): Set<string> {
  const declared = passport.parts.find((candidate) => candidate.name === part)?.variables ?? [];

  return new Set(declared.map((variable) => property(variable.name)));
}

export function variableHomes(lookup: PassportLookup, components: Iterable<string>): Map<string, VariableHome[]> {
  const homes = new Map<string, VariableHome[]>();

  for (const component of components) {
    const passport = lookup(component);
    if (!passport) continue;

    for (const part of passport.parts) {
      for (const variable of part.variables ?? []) {
        const name = property(variable.name);
        homes.set(name, [...(homes.get(name) ?? []), { component, part: part.name, setBy: variable.setBy }]);
      }
    }
  }

  return homes;
}

export function homesText(homes: readonly VariableHome[]): string {
  return homes.map((home) => `${home.component}.${home.part}`).join(", ");
}
