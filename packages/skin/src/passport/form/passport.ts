// Design notes: ./README.md#passport

import type { AnatomyPart } from "@zag-js/anatomy";
import type { PassportSelfAssembly } from "../assembly/index.js";
import type { PassportAnatomy } from "./anatomy.js";
import type { PassportPart, PassportVariantAxis } from "./part.js";
import { SETTINGS, type PassportSetting } from "./settings.js";

export interface ComponentPassport<Part extends string = string> {
  readonly component: string;
  readonly anatomy: PassportAnatomy<Part>;
  readonly root: Part;
  readonly parts: readonly PassportPart<Part>[];
  readonly variantAxis: PassportVariantAxis;
  readonly settings: Readonly<Record<string, PassportSetting>>;
  readonly selfAssembly?: PassportSelfAssembly<Part>;
}

export interface PassportSpec<Part extends string> {
  readonly anatomy: PassportAnatomy<Part>;
  readonly root: Part;
  readonly parts: readonly PassportPart<Part>[];
  readonly variantAxis: PassportVariantAxis;
  readonly settings: Readonly<Record<string, PassportSetting>>;
  readonly selfAssembly?: PassportSelfAssembly<Part>;
}

// `const Spec`, return `Spec & {component}` — not `ComponentPassport<Part>` (`PWEB-207`): coercing
// to that fixed interface would re-widen `parts[].states[].name` and any other nested literal down
// to `string` on the way out, the exact loss `StatesOf`/`ValuesOf` (`./derive.ts`) need NOT to
// happen. `PassportSpec<string>` stays the CONSTRAINT (still enforces the same shape and runs the
// same checks below), it just stops being the RETURN type. The result remains assignable to
// `ComponentPassport<Part>` wherever code asks for the general shape — nothing downstream changes.
export function definePassport<const Spec extends PassportSpec<string>>(
  spec: Spec,
): Spec & { readonly component: string } {
  const parts = spec.anatomy.build();
  const first = Object.values<AnatomyPart>(parts)[0];

  if (!first) {
    throw new Error("anatomy has no parts: nothing for the passport to declare");
  }

  const component = first.attrs["data-scope"];

  if (!spec.settings) {
    throw new Error(
      'passport without settings: declare "settings" — an empty record {} is the answer "no ' +
        'settings", and its absence is indistinguishable from an oversight',
    );
  }

  const strange = Object.keys(spec.settings).filter((name) => !Object.hasOwn(SETTINGS, name));

  if (strange.length > 0) {
    throw new Error(`settings outside the list: ${strange.join(", ")}; allowed: ${Object.keys(SETTINGS).join(", ")}`);
  }

  for (const [name, setting] of Object.entries(spec.settings)) {
    const on = setting.dependsOn?.on;

    if (on !== undefined && !Object.hasOwn(spec.settings, on)) {
      throw new Error(`setting "${name}" depends on "${on}", which the component does not have`);
    }
  }

  for (const part of spec.parts) {
    for (const variable of part.variables ?? []) {
      if (!variable.name.startsWith("--")) {
        throw new Error(`variable "${variable.name}" of part "${part.name}" is not a custom property: its name must start with two dashes`);
      }
    }
  }

  if (spec.selfAssembly && spec.selfAssembly.tree.node !== spec.root) {
    throw new Error(
      `self-assembly of "${component}" starts at node "${spec.selfAssembly.tree.node}", but the ` +
        `component's root is "${spec.root}"`,
    );
  }

  return { ...spec, component };
}
