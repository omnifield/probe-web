// Реестр кита — тонкая обёртка, механики здесь нет ни строки.
//
// `PASSPORTS`/`EDITOR_INFOS`/`IO` уже собраны барреллом (`packages/ui/src/passport.ts`,
// `packages/ui/src/io.ts`, «ПОРОЖДЁН СБОРКОЙ scripts/generate.mjs») — этот файл только читает
// готовое и складывает срез рантайма (`ComponentPassport.anatomy` — функции, не данные) в форму,
// которую можно вернуть по MCP как JSON.

import { EDITOR_INFOS, PASSPORTS } from "@web-core/ui/passport";
import { IO } from "@web-core/ui/io";
import { z } from "@web-core/io";
import { zocker } from "zocker";

/**
 * Пример данных по io-схеме компонента — то же, чем `checkAssemblyData` сверяет `bind`/
 * `repeat.path`. Схемы нет — `undefined`, и данные не с чем сверять, а не пустой объект-обман.
 *
 * Само значение листа здесь никого не интересует (`checkAssemblyData` только спрашивает
 * «нашлось ли что-то», не «то ли это значение») — `zocker` строит валидный по схеме экземпляр
 * целиком сам (объекты/массивы/`enum`/юнионы/regex), тем же движком, каким продукт строит
 * заготовки для показа: один способ прочитать io-схему, не два разных.
 */
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

/**
 * Паспорт компонента структурированно, для одной ручки, без похода по TS-исходникам.
 *
 * `anatomy` — функции (`AnatomyPart`, Zag), не данные: возвращается только `anatomyKeys`,
 * тот же список имён частей, что и `passport.anatomy.keys()`.
 */
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
