// Связка с источником паспортов — по правилу зоны `packages/skin`, источник называется ОДИН раз
// (`PWEB-94`, README «Источник паспортов называется один раз»): проверка и порождение обязаны
// ходить к тому же источнику, иначе они способны разойтись тихо.

import { passportLookup, withPassports } from "@omnifield/probe-web-skin";
import {
  checkAssembly as checkAssemblyRaw,
  checkAssemblyData as checkAssemblyDataRaw,
  admits,
} from "@omnifield/probe-web-skin/editor";
import { skinGaps as skinGapsRaw } from "@omnifield/probe-web-skin";
import type { Skin } from "@omnifield/probe-web-skin/model";
import { allEditorInfos, allPassports, editorInfoOf, exampleDataFor, passportOf } from "./kit";

const lookup = passportLookup(allPassports());
const bound = withPassports(lookup);

/** `checkOutfit`, `assemble`, `checkSkin`, `checkSketch`, `generateSkinCss`, `generateSketchCss`. */
export const skin = bound;

export { admits };

/**
 * Структура (`checkAssembly`) и данные (`checkAssemblyData`) — два разных обхода одного дерева,
 * найдено живым тестом заявки: `checkAssembly` по своему устройству никогда не читает
 * `bind`/`props`/`on` (`packages/skin/src/passport/editor/check-assembly.ts`, комментарий у
 * самого `as` в обходе) — опечатка в пути раньше проходила молча, `{ok:true}` наравне с верным
 * деревом. Данные не проверяются, если структура уже сломана — путь в дереве, которое само не
 * складывается, проверять не с руки, вторая порция флавов только заслонила бы первую.
 *
 * Данные сверяются с ПРИМЕРОМ по io-схеме компонента (`exampleDataFor`), не с чем-то вручную
 * подобранным — компонент без `entity/io.ts` не проверяется вовсе, и это называется явно
 * (`dataCheck: "skipped…"`), а не молчаливым `ok:true`.
 *
 * `checkAssembly` (структурная половина) по устройству механики БРОСАЕТ на первом же нарушении —
 * MCP-ручке исключение через границу протокола отдавать не с руки, здесь оно ловится.
 */
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
