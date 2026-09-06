import { EDITOR_INFOS, PASSPORTS } from "@web-core/ui/passport";
import { IO } from "@web-core/ui/io";
import { z } from "@web-core/io";
import { zocker } from "zocker";

export function exampleDataFor(component: string): unknown {
  const input = IO[component]?.input;
  return input ? zocker(input).generate() : undefined;
}

export function listComponents() {
  return Object.keys(PASSPORTS)
    .toSorted()
    .map((name) => {
      const editor = EDITOR_INFOS[name];
      return {
        component: name,
        genus: editor?.genus,
        group: editor?.group,
        footprint: editor?.footprint,
        package: editor?.package,
        parts: PASSPORTS[name]?.anatomy.keys() ?? [],
        assemblies: (editor?.assemblies ?? []).map((a) => ({ name: a.name, means: a.means })),
      };
    });
}

export function getPassport(component: string) {
  const passport = PASSPORTS[component];
  if (!passport) return undefined;

  const editor = EDITOR_INFOS[component];
  const io = IO[component];

  return {
    component,
    passport: {
      root: passport.root,
      anatomyKeys: passport.anatomy.keys(),
      parts: passport.parts,
      variantAxis: passport.variantAxis,
      settings: passport.settings,
      selfAssembly: passport.selfAssembly,
    },
    editor,
    io: io
      ? {
          input: io.input ? z.toJSONSchema(io.input) : undefined,
          output: io.output ? z.toJSONSchema(io.output) : undefined,
        }
      : undefined,
  };
}

export function allPassports() {
  return Object.values(PASSPORTS);
}

export function allEditorInfos() {
  return Object.values(EDITOR_INFOS);
}

export function passportOf(component: string) {
  return PASSPORTS[component];
}

export function editorInfoOf(component: string) {
  return EDITOR_INFOS[component];
}
