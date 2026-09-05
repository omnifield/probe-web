
import { passportLookup } from "../address/index.js";
import type { ComponentPassport } from "../passport/form/index.js";
import type { PassportEditorInfo } from "../../editor/types.js";
import type { Skin } from "../recipe/index.js";
import { skinRules } from "../rules/index.js";
import { trace } from "../../trace/index.js";
import { gapsOfComponent } from "./component.js";
import { dressed } from "./dressed.js";
import type { SkinGap } from "./types.js";

export type { SkinGap, SkinGapKind } from "./types.js";

export function skinGaps(
  skin: Skin,
  passports: Iterable<ComponentPassport>,
  editorInfo?: Iterable<PassportEditorInfo>,
): readonly SkinGap[] {
  const done = trace(`skinGaps(${skin.name})`);

  const list = [...passports];
  const editors = editorInfo ? [...editorInfo] : [];
  const touched = dressed(skinRules(skin, passportLookup(list)).rules);

  const gaps: SkinGap[] = [];

  for (const passport of list) {
    if (!(passport.component in skin.recipes)) {
      gaps.push({
        kind: "component",
        component: passport.component,
        means: `component "${passport.component}" is declared, but has no recipe in the skin`,
      });
      continue;
    }

    gapsOfComponent(passport, touched, editors, gaps);
  }

  done();
  return gaps;
}
