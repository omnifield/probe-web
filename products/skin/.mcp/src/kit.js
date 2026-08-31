// Реестр кита — тонкая обёртка, механики здесь нет ни строки.
//
// `PASSPORTS`/`EDITOR_INFOS`/`IO` уже собраны барреллом (`packages/ui/src/passport.ts`,
// `packages/ui/src/io.ts`, «ПОРОЖДЁН СБОРКОЙ scripts/generate.mjs») — этот файл только читает
// готовое и складывает срез рантайма (`ComponentPassport.anatomy` — функции, не данные) в форму,
// которую можно вернуть по MCP как JSON.

import { EDITOR_INFOS, PASSPORTS } from "@omnifield/probe-web-ui/passport";
import { IO } from "@omnifield/probe-web-ui/io";
import { z } from "@omnifield/probe-web-io";

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

/**
 * Паспорт компонента структурированно, для одной ручки, без похода по TS-исходникам.
 *
 * `anatomy` — функции (`AnatomyPart`, Zag), не данные: возвращается только `anatomyKeys`,
 * тот же список имён частей, что и `passport.anatomy.keys()`.
 *
 * @param {string} component
 */
export function getPassport(component) {
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

/** @param {string} component */
export function passportOf(component) {
  return PASSPORTS[component];
}

/** @param {string} component */
export function editorInfoOf(component) {
  return EDITOR_INFOS[component];
}
