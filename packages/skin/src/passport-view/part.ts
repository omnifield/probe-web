// Design notes: ./README.md#part

import type { ComponentPassport, PassportPart } from "../passport/form/index.js";

export function partOf<Part extends string>(
  passport: ComponentPassport<Part>,
  name: string,
): PassportPart<Part> | undefined {
  return passport.parts.find((part) => part.name === name);
}
