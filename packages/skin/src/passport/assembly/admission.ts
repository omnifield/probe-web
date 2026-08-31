// Design notes: ./README.md#admission

export type PassportGenus = "text" | "icon";

export type PassportComponentGenus = "icon" | "component";

// `Registry` — see `./nodes.ts`'s `PassportAssemblyElement` (`PWEB-208`): `name` restricts to
// EITHER an own part name OR a registry component name, same open half as `node`.
export type PassportAdmission<Part extends string = string, Registry extends string = string> =
  | {
      readonly kind: "content";
      readonly genus: PassportGenus;
    }
  | {
      readonly kind: "component";
      readonly genus?: PassportComponentGenus;
      readonly name?: Part | Registry;
    };

export interface PassportPartAdmission<Part extends string = string, Registry extends string = string> {
  readonly accepts?: readonly PassportAdmission<Part, Registry>[];
}

// `candidate` stays the untightened default `PassportAdmission` — not `<Part, Registry>` matching
// `part` — on purpose: it is built at RUNTIME from an actual node (`../editor/check-assembly.ts`),
// never authored by a human, and its `name` can be an extras key (`PWEB-165`, private, never
// closed to any list). `Part | Registry` is worth checking only on the AUTHORED side, `accepts`.
export function admits<Part extends string, Registry extends string = string>(
  part: PassportPartAdmission<Part, Registry>,
  candidate: PassportAdmission,
): boolean {
  const accepts = part.accepts;

  if (!accepts) return true;

  return accepts.some((allowed) => {
    if (candidate.kind === "content") {
      return allowed.kind === "content" && allowed.genus === candidate.genus;
    }

    return (
      allowed.kind === "component" &&
      (allowed.genus === undefined || candidate.genus === undefined || allowed.genus === candidate.genus) &&
      (allowed.name === undefined || allowed.name === candidate.name)
    );
  });
}
