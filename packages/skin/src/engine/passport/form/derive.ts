/** Имена частей, которые паспорт реально объявил — из его собственного литерального типа. */
export type PartOf<Passport extends { readonly parts: readonly { readonly name: string }[] }> =
  Passport["parts"][number]["name"];

/** Имена состояний, объявленных для ОДНОЙ конкретной части паспорта. */
export type StatesOf<
  Passport extends {
    readonly parts: readonly { readonly name: string; readonly states: readonly { readonly name: string }[] }[];
  },
  Part extends PartOf<Passport>,
> = Extract<Passport["parts"][number], { readonly name: Part }>["states"][number]["name"];

type ChoiceValuesOf<Setting> = Setting extends { readonly values: { readonly kind: "choice"; readonly options: readonly { readonly value: infer Value }[] } }
  ? Value
  : boolean;

/** Значения, которые реально принимает одна настройка паспорта. */
export type ValuesOf<
  Passport extends { readonly settings: Readonly<Record<string, unknown>> },
  Setting extends keyof Passport["settings"],
> = ChoiceValuesOf<Passport["settings"][Setting]>;
