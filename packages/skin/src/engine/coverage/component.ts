
import { addressesView, type ComponentPassport } from "../passport/form/index.js";
import type { PassportEditorInfo } from "../../editor/types.js";
import { partOf } from "../passport-view/index.js";
import type { SkinGap } from "./types.js";

function meansOfState(
  editors: readonly PassportEditorInfo[],
  component: string,
  part: string,
  state: string,
): string | undefined {
  const editor = editors.find((entry) => entry.component === component);
  return editor?.parts[part]?.states?.[state]?.means;
}

export function gapsOfComponent(
  passport: ComponentPassport,
  touched: { parts: ReadonlySet<string>; states: ReadonlySet<string> },
  editors: readonly PassportEditorInfo[],
  gaps: SkinGap[],
): void {
  const component = passport.component;

  for (const part of passport.anatomy.keys()) {
    if (!touched.parts.has(`${component}.${part}`)) {
      gaps.push({
        kind: "part",
        component,
        part,
        means: `part "${part}" of component "${component}" is declared, but no skin rule touches it`,
      });
      continue;
    }

    for (const state of partOf(passport, part)?.states ?? []) {
      if (!addressesView(state)) continue;

      if (touched.states.has(`${component}.${part}:${state.name}`)) continue;

      const editorMeans = meansOfState(editors, component, part, state.name);
      const suffix = editorMeans ? ` (${editorMeans})` : "";

      gaps.push({
        kind: "state",
        component,
        part,
        state: state.name,
        means: `state "${state.name}" of part "${part}"${suffix} is declared, but no skin rule addresses it`,
      });
    }
  }
}
