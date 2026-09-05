
import type { ComponentPassport } from "../passport/form/index.js";

export type PassportLookup = (component: string) => ComponentPassport | undefined;

export function passportLookup(passports: Iterable<ComponentPassport>): PassportLookup {
  const byName = new Map<string, ComponentPassport>();
  for (const passport of passports) byName.set(passport.component, passport);

  return (component) => byName.get(component);
}
