// Design notes: ./README.md#types

import type { DataPreset, PassportAdmission, PassportAssembly, PassportComponentGenus } from "../assembly/index.js";
import type { ComponentPassport, PartOf, StatesOf, ValuesOf } from "../form/index.js";
import type { ComponentFootprint, ComponentGroup } from "./groups.js";

export interface PassportStateEditorInfo {
  readonly means: string;
}

export interface PassportVariableEditorInfo {
  readonly means: string;
}

export interface PassportSettingOptionEditorInfo {
  readonly means: string;
}

// `Values` — the setting's own real value union (`ValuesOf`, `PWEB-207`/follow-up), default
// `string | boolean` (a component's own state was never distinguished from a foreign one before).
// `options`' key set is `Extract<Values, string>` for a real `"choice"` setting — the literal
// values it actually declared — but falls back to a permissive `string` whenever that extraction
// is `never`: either `Values` is still the untyped default, OR `Values` resolved to plain `boolean`
// (a confirmed `"flag"` setting, which never checks `options` at runtime either — `define.ts`'s own
// `if (values.kind !== "choice") continue`). `never` itself (forbidding `options` outright) was
// tried and rejected: it made a REAL choice setting's `PassportSettingEditorInfo` fail to widen
// into the untyped default form `editorInfoOf`'s registry return type relies on everywhere in the
// kit — `[X] extends [never]` (boxed, not `X extends never`) side-steps the SAME general/`boolean`
// case incorrectly matching `never` that the bare form would produce.
export interface PassportSettingEditorInfo<Values = string | boolean> {
  readonly means: string;
  readonly options?: Readonly<
    Record<[Extract<Values, string>] extends [never] ? string : Extract<Values, string>, PassportSettingOptionEditorInfo>
  >;
}

// `States` — the states union real for the ONE part this record describes (`StatesOf`, same
// ticket), default `string` (every part shared one loose shape before). NOT resolved from `Part`
// alone — different parts of the same component have different state dictionaries (accordion's
// `root` has none, `itemTrigger` has six) — see `PassportEditorInfo`'s `parts` field below for
// where the per-part `StatesOf<Passport, P>` actually gets computed.
export interface PassportPartEditorInfo<Part extends string = string, Registry extends string = string, States extends string = string> {
  readonly means: string;
  readonly accepts?: readonly PassportAdmission<Part, Registry>[];
  readonly states?: Readonly<Record<States, PassportStateEditorInfo>>;
  readonly variables?: Readonly<Record<string, PassportVariableEditorInfo>>;
}

// `Data` — third type parameter (`PWEB-209` follow-up): the same io schema `PassportAssembly`
// itself carries, threaded one door further out so a real, Data-typed assembly can be named in
// `spec.assemblies` at all. NOT a default-and-forget like `Part`/`Registry`: a `PassportAssembly`
// built with a real schema is NOT assignable to one typed `PassportAssembly<Part, Registry>` (Data
// defaulting `unknown`) — TypeScript compares `Data` itself, not the fields `BoundPath`/`Paths`
// expand it into, once two DIFFERENT instantiations of the same conditional-type-backed generic
// meet (found live: piloting a real `Data` argument against accordion's actual `entity/io.ts`,
// `PassportAssembly<AccordionPart, string, AccordionInput>` refused to widen into
// `PassportEditorSpec.assemblies`'s old two-parameter form). Threading `Data` through, rather than
// leaning on that widening, is the fix — both sides then share the SAME instantiation, so no
// cross-`Data` comparison is ever attempted.
//
// `Passport` — fourth (`PWEB-207` follow-up), and deliberately LAST, defaulting from `Part`
// (`ComponentPassport<Part>`) rather than replacing it: `Part` stays the thing that decides WHICH
// keys `parts` must carry (unchanged from before this), `Passport` exists purely so `StatesOf`/
// `ValuesOf` have a real, literal-preserving passport to read per-key states/values FROM. Kept
// separate rather than derived (`Part = PartOf<Passport>`) so every existing 2-and-3-argument
// instantiation across the kit — none of which name `Passport` — keeps compiling exactly as before,
// Passport's default (the widened `ComponentPassport<Part>`) degrading `StatesOf`/`ValuesOf` to the
// same permissive shape `Data`/`Registry` degrade to at their own defaults (proven: a real 4-argument
// `PassportEditorInfo` still widens into the bare, all-defaults form `editorInfoOf`'s registries use
// everywhere — `test/editor-states.test.ts`).
export interface PassportEditorInfo<
  Part extends string = string,
  Registry extends string = string,
  Data = unknown,
  Passport extends ComponentPassport<Part> = ComponentPassport<Part>,
> {
  readonly component: string;
  readonly package: string;
  readonly genus: PassportComponentGenus;
  readonly group?: ComponentGroup;
  readonly footprint?: ComponentFootprint;
  readonly variantAxis: { readonly means: string };
  readonly parts: { readonly [P in Part]: PassportPartEditorInfo<Part, Registry, StatesOf<Passport, P & PartOf<Passport>>> };
  readonly settings?: { readonly [S in Extract<keyof Passport["settings"], string>]: PassportSettingEditorInfo<ValuesOf<Passport, S>> };
  readonly assemblies: readonly PassportAssembly<Part, Registry, Data>[];
  readonly dataPresets: readonly DataPreset[];
}

export interface PassportEditorSpec<
  Part extends string,
  Registry extends string = string,
  Data = unknown,
  Passport extends ComponentPassport<Part> = ComponentPassport<Part>,
> {
  readonly package: string;
  readonly genus: PassportComponentGenus;
  readonly group?: ComponentGroup;
  readonly footprint?: ComponentFootprint;
  readonly variantAxis: { readonly means: string };
  readonly parts: { readonly [P in Part]: PassportPartEditorInfo<Part, Registry, StatesOf<Passport, P & PartOf<Passport>>> };
  readonly settings?: { readonly [S in Extract<keyof Passport["settings"], string>]: PassportSettingEditorInfo<ValuesOf<Passport, S>> };
  readonly assemblies?: readonly PassportAssembly<Part, Registry, Data>[];
  readonly dataPresets?: readonly DataPreset[];
}
