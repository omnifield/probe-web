
import type { ComponentPassport, PassportSettingName } from "../engine/passport/form/index.js";
import { checkAssembly } from "./check-assembly.js";
import { GROUPS } from "./groups.js";
import type { PassportEditorInfo, PassportEditorSpec, PassportSettingEditorInfo } from "./types.js";

// `Passport` выводится из аргумента `passport`, не из его широкого типа — иначе `StatesOf`/
// `ValuesOf` нечего было бы читать per-part.
export function defineEditorInfo<
  Part extends string,
  Registry extends string = string,
  Data = unknown,
  Passport extends ComponentPassport<Part> = ComponentPassport<Part>,
>(passport: Passport, spec: PassportEditorSpec<Part, Registry, Data, Passport>): PassportEditorInfo<Part, Registry, Data, Passport> {
  const component = passport.component;

  if (spec.group !== undefined && !Object.hasOwn(GROUPS, spec.group)) {
    throw new Error(`group "${spec.group}" is not in the list; allowed: ${Object.keys(GROUPS).join(", ")}`);
  }

  const anatomyParts = passport.anatomy.keys();
  const specParts = Object.keys(spec.parts);

  const missingParts = anatomyParts.filter((part) => !specParts.includes(part));
  if (missingParts.length > 0) {
    throw new Error(`editor slice of "${component}" did not assign parts: ${missingParts.join(", ")}`);
  }

  const strangeParts = specParts.filter((part) => !anatomyParts.includes(part as Part));
  if (strangeParts.length > 0) {
    throw new Error(`editor slice of "${component}" names a part outside anatomy: ${strangeParts.join(", ")}`);
  }

  for (const part of passport.parts) {
    const editorPart = spec.parts[part.name];

    const stateNames = part.states.map((state) => state.name);
    const editorStateNames = Object.keys(editorPart.states ?? {});
    if (stateNames.some((name) => !editorStateNames.includes(name)) || editorStateNames.some((name) => !stateNames.includes(name))) {
      throw new Error(
        `editor slice of part "${part.name}" of "${component}" does not match runtime states: ` +
          `runtime — ${stateNames.join(", ") || "(none)"}, editor — ${editorStateNames.join(", ") || "(none)"}`,
      );
    }

    const variableNames = (part.variables ?? []).map((variable) => variable.name);
    const editorVariableNames = Object.keys(editorPart.variables ?? {});
    if (
      variableNames.some((name) => !editorVariableNames.includes(name)) ||
      editorVariableNames.some((name) => !variableNames.includes(name))
    ) {
      throw new Error(
        `editor slice of part "${part.name}" of "${component}" does not match runtime variables: ` +
          `runtime — ${variableNames.join(", ") || "(none)"}, editor — ${editorVariableNames.join(", ") || "(none)"}`,
      );
    }
  }

  const settingNames = Object.keys(passport.settings) as PassportSettingName[];
  // Широкая форма нарочно: реальный тип `spec.settings` уже, чем полный словарь имён.
  const editorSettings = (spec.settings ?? {}) as Readonly<Record<string, PassportSettingEditorInfo>>;
  const missingSettings = settingNames.filter((name) => !Object.hasOwn(editorSettings, name));
  if (missingSettings.length > 0) {
    throw new Error(`editor slice of "${component}" did not assign settings: ${missingSettings.join(", ")}`);
  }

  for (const name of settingNames) {
    const values = passport.settings[name]!.values;
    if (values.kind !== "choice") continue;

    const optionValues = values.options.map((option) => option.value);
    const editorOptions = Object.keys(editorSettings[name]?.options ?? {});
    if (
      optionValues.some((value) => !editorOptions.includes(value)) ||
      editorOptions.some((value) => !optionValues.includes(value))
    ) {
      throw new Error(
        `editor slice of setting "${name}" of "${component}" does not match runtime values: ` +
          `runtime — ${optionValues.join(", ") || "(none)"}, editor — ${editorOptions.join(", ") || "(none)"}`,
      );
    }
  }

  const assemblies = spec.assemblies ?? [];
  const assemblyNames = new Set<string>();

  for (const assembly of assemblies) {
    checkAssembly(component, passport, spec.parts, assembly);

    if (assemblyNames.has(assembly.name)) {
      throw new Error(`assembly "${component}.${assembly.name}" is named twice — a name is an address`);
    }
    assemblyNames.add(assembly.name);
  }

  const dataPresets = spec.dataPresets ?? [];
  const presetNames = new Set<string>();

  for (const preset of dataPresets) {
    if (presetNames.has(preset.name)) {
      throw new Error(`data preset "${component}.${preset.name}" is named twice — a name is an address`);
    }
    presetNames.add(preset.name);
  }

  return {
    component,
    package: spec.package,
    genus: spec.genus,
    group: spec.group,
    footprint: spec.footprint,
    variantAxis: spec.variantAxis,
    parts: spec.parts,
    settings: spec.settings,
    assemblies,
    dataPresets,
  };
}
