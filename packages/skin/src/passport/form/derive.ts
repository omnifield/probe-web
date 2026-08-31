// Design notes: ./README.md#derive

/**
 * The part names a passport actually declared — same answer as the copy-pasted
 * `typeof passport extends ComponentPassport<infer Part> ? Part : never` (31 times across
 * `packages/ui`, one per component), spelled once. Works on ANY object with a `parts` array shaped
 * like a passport's, not only `ComponentPassport` itself — the constraint is structural on purpose,
 * so a component's `typeof passport` (kept literal by `definePassport`'s `const`, `PWEB-207`)
 * narrows all the way to the real names instead of widening through the general interface.
 */
export type PartOf<Passport extends { readonly parts: readonly { readonly name: string }[] }> =
  Passport["parts"][number]["name"];

/**
 * The state names declared for ONE specific part of a passport — `passport.parts[part].states`,
 * as a literal union, not the `readonly PassportState[]` (`name: string`) shape of `PassportPart`
 * itself. `Extract` picks the single tuple element whose `name` literal matches `Part` out of the
 * union `Passport["parts"][number]` — the same "match by literal field" idiom `PartOf` and the
 * existing `ComponentPassport<infer Part>` trick both already lean on, just one level deeper
 * (`PWEB-207`, group B of the closed-set audit).
 *
 * Requires the passport's own literal shape (`typeof passport`, not the widened
 * `ComponentPassport<Part>` interface) — a part's states differ from its neighbor's (accordion's
 * `root` has none, `itemTrigger` has six), so there is no single `State` type parameter shared
 * across the whole `parts` array that could answer this; only indexing into the actual literal
 * tuple can.
 */
export type StatesOf<
  Passport extends {
    readonly parts: readonly { readonly name: string; readonly states: readonly { readonly name: string }[] }[];
  },
  Part extends PartOf<Passport>,
> = Extract<Passport["parts"][number], { readonly name: Part }>["states"][number]["name"];

type ChoiceValuesOf<Setting> = Setting extends { readonly values: { readonly kind: "choice"; readonly options: readonly { readonly value: infer Value }[] } }
  ? Value
  : boolean;

/**
 * The values one setting of a passport actually accepts — a `"choice"` setting's `options[].value`
 * union, or `boolean` for a `"flag"` setting. Same shape of problem as `StatesOf`, one door over:
 * `defineSettings`'s `const T` (`PWEB-207`) is what keeps `options[].value` literal long enough for
 * this to read something other than `string`.
 */
export type ValuesOf<
  Passport extends { readonly settings: Readonly<Record<string, unknown>> },
  Setting extends keyof Passport["settings"],
> = ChoiceValuesOf<Passport["settings"][Setting]>;
