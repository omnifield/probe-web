import { passportLookup, withPassports } from "@web-core/skin";
import {
  checkAssembly as checkAssemblyRaw,
  checkAssemblyData as checkAssemblyDataRaw,
  admits,
} from "@web-core/skin/editor";
import { skinGaps as skinGapsRaw } from "@web-core/skin";
import type { Skin } from "@web-core/skin/model";
import { allEditorInfos, allPassports, editorInfoOf, exampleDataFor, passportOf } from "./kit";

const lookup = passportLookup(allPassports());
const bound = withPassports(lookup);

export const skin = bound;

export { admits };

export function checkAssembly(component: string, assembly: unknown) {
  const passport = passportOf(component);
  const editor = editorInfoOf(component);

  if (!passport) return { ok: false, error: `unknown component "${component}" — no passport in the kit` };
  if (!editor) return { ok: false, error: `unknown component "${component}" — no editor info in the kit` };

  try {
    checkAssemblyRaw(component, passport, editor.parts, assembly as never);
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
  }

  const example = exampleDataFor(component);
  if (example === undefined) {
    return { ok: true, dataCheck: "skipped — component has no entity/io.ts, nothing to check bind/repeat.path against" };
  }

  const dataFlaws = checkAssemblyDataRaw(component, assembly as never, example);
  return { ok: dataFlaws.length === 0, dataCheck: "checked against an io-schema example", dataFlaws };
}

export function skinGaps(skinRecord: Skin) {
  return skinGapsRaw(skinRecord, allPassports(), allEditorInfos());
}
