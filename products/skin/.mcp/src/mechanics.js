// Связка с источником паспортов — по правилу зоны `packages/skin`, источник называется ОДИН раз
// (`PWEB-94`, README «Источник паспортов называется один раз»): проверка и порождение обязаны
// ходить к тому же источнику, иначе они способны разойтись тихо.

import { passportLookup, withPassports } from "@omnifield/probe-web-skin";
import { checkAssembly as checkAssemblyRaw, admits } from "@omnifield/probe-web-skin/editor";
import { skinGaps as skinGapsRaw } from "@omnifield/probe-web-skin";
import { allEditorInfos, allPassports, editorInfoOf, passportOf } from "./kit.js";

const lookup = passportLookup(allPassports());
const bound = withPassports(lookup);

/** `checkOutfit`, `assemble`, `checkSkin`, `checkSketch`, `generateSkinCss`, `generateSketchCss`. */
export const skin = bound;

export { admits };

/**
 * Оборачивает `checkAssembly`, которая по устройству механики БРОСАЕТ на первом же нарушении
 * (`packages/skin/src/passport/editor/check-assembly.ts`), — MCP-ручке исключение через границу
 * протокола отдавать не с руки, здесь оно ловится и превращается в значение.
 *
 * @param {string} component
 * @param {unknown} assembly
 */
export function checkAssembly(component, assembly) {
  const passport = passportOf(component);
  const editor = editorInfoOf(component);

  if (!passport) return { ok: false, error: `unknown component "${component}" — no passport in the kit` };
  if (!editor) return { ok: false, error: `unknown component "${component}" — no editor info in the kit` };

  try {
    checkAssemblyRaw(component, passport, editor.parts, /** @type {never} */ (assembly));
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : String(cause) };
  }
}

/** @param {import("@omnifield/probe-web-skin/model").Skin} skinRecord */
export function skinGaps(skinRecord) {
  return skinGapsRaw(skinRecord, allPassports(), allEditorInfos());
}
