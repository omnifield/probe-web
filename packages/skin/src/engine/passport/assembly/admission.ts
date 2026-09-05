
export type PassportGenus = "text" | "icon";

export type PassportComponentGenus = "icon" | "component";

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

// `candidate` — нетипизированный `PassportAdmission`, не `<Part, Registry>`: строится в рантайме
// из настоящего узла, не автором, и имя может быть закрытым `extras`-ключом.
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
