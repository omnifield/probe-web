
import type { DataPreset, PassportAdmission, PassportAssembly, PassportComponentGenus } from "../engine/passport/assembly/index.js";
import type { ComponentPassport, PartOf, StatesOf, ValuesOf } from "../engine/passport/form/index.js";
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

// `Values` — реальный набор значений настройки, по умолчанию `string | boolean`. Разбор дженериков
// (почему `[X] extends [never]`, а не `X extends never`) — FAQ.md.
export interface PassportSettingEditorInfo<Values = string | boolean> {
  readonly means: string;
  readonly options?: Readonly<
    Record<[Extract<Values, string>] extends [never] ? string : Extract<Values, string>, PassportSettingOptionEditorInfo>
  >;
}

// `States` — набор состояний, реальный для ОДНОЙ описываемой части, не для компонента целиком:
// разные части одного компонента несут разные словари состояний.
export interface PassportPartEditorInfo<Part extends string = string, Registry extends string = string, States extends string = string> {
  readonly means: string;
  readonly accepts?: readonly PassportAdmission<Part, Registry>[];
  readonly states?: Readonly<Record<States, PassportStateEditorInfo>>;
  readonly variables?: Readonly<Record<string, PassportVariableEditorInfo>>;
}

// `Data`/`Passport` — дженерики для io-схемы сборки и для per-part состояний/значений; оба
// с умолчаниями, старые 2-3-аргументные объявления по киту продолжают типизироваться как раньше.
// Разбор конкретной находки (почему нельзя опереться на расширение типа) — FAQ.md.
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
