// см. README.md / FAQ.md

import type {
  PassportAdmission,
  PassportComponentGenus,
  PassportGenus,
} from "@web-core/skin/editor";

import type { SelfAssembly } from "./self-assembly.js";

export type Genus = PassportGenus;

export type ComponentGenus = PassportComponentGenus;

export type Admission = PassportAdmission;

export interface ReadablePart {
  readonly name: string;
  readonly accepts?: readonly Admission[];
}

export interface ReadablePassport {
  readonly component: string;
  readonly genus: ComponentGenus;
  readonly anatomy: { keys: () => string[] };
  readonly root: string;
  readonly parts: readonly ReadablePart[];
  readonly selfAssembly?: SelfAssembly;
}

export interface AdmissionRule {
  admits(part: ReadablePart, candidate: Admission): boolean;
}

export function partOf(passport: ReadablePassport, name: string): ReadablePart | undefined {
  return passport.parts.find((part) => part.name === name);
}
