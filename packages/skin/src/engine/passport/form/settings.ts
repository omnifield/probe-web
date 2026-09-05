
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

// Каррирована — TypeScript не умеет частичный вывод типовых аргументов, и одним вызовом заданный
// `Props` вынудил бы называть и `T`. Возвращает `T` буквально, не `PassportSettings<Props>` —
// иначе значения сузились бы обратно до `string`.
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
