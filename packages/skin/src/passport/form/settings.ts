// Design notes: ./README.md#settings

import type { PassportMark } from "./mark.js";

export const SETTINGS = {
  orientation: "Orientation",
  multiple: "Multiple at once",
  collapsible: "Can close all",
  outlined: "Outlined",
} as const satisfies Readonly<Record<string, string>>;

export type PassportSettingName = keyof typeof SETTINGS;

export interface PassportSettingOption {
  readonly value: string;
}

export type PassportSettingValues =
  | { readonly kind: "flag" }
  | { readonly kind: "choice"; readonly options: readonly PassportSettingOption[] };

export interface PassportSettingDependency {
  readonly on: PassportSettingName;
  readonly redundantWhen: string | boolean;
}

export interface PassportSetting {
  readonly values: PassportSettingValues;
  readonly byDefault: string | boolean;
  readonly mark?: PassportMark;
  readonly dependsOn?: PassportSettingDependency;
}

export type PassportSettings<Props> = Readonly<Record<Extract<keyof Props, PassportSettingName>, PassportSetting>>;

// Curried, not `defineSettings<Props, const T extends ...>(settings)` in one call (`PWEB-207`):
// TypeScript has no partial type-argument inference — a caller giving `Props` explicitly (the only
// way to name it; nothing in `settings` implies it) would then be FORCED to also spell out `T`,
// defeating the entire point. Fixing `Props` first and inferring `T` from the one remaining call is
// the standard shape for exactly this split (same trick as e.g. zustand's `create<State>()(...)`).
//
// `T`, not `PassportSettings<Props>` again, as the return type: printing that name a second time
// would re-widen every option's `value` down to `string`, the same loss `PartStyles` used to force
// before `PWEB-206`. `T` is the literal shape of what was actually passed in; `PassportSettings<Props>`
// stays only as the inner call's CONSTRAINT — checked for, not printed.
export function defineSettings<Props>(): <const T extends PassportSettings<Props>>(settings: T) => T {
  return (settings) => settings;
}

export function settingApplies(
  settings: Readonly<Record<string, PassportSetting>>,
  name: string,
  values: Readonly<Record<string, unknown>>,
): boolean {
  const dependency = settings[name]?.dependsOn;

  if (!dependency) return true;

  const source = settings[dependency.on];
  const actual = values[dependency.on] ?? source?.byDefault;

  return actual !== dependency.redundantWhen;
}
