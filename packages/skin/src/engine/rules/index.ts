
import { nodeSelector, partSelector, safeName, type PassportLookup } from "../address/index.js";
import type { Skin, SketchEdit } from "../recipe/index.js";
import { seedRefusals } from "../seeds/index.js";
import { sizeRefusals } from "../sizes/index.js";
import { trace } from "../../trace/index.js";
import { partVariables, variableHomes } from "../variables/index.js";
import { checkKeyframeReferences, checkKeyframeShape, motionSites } from "./check-motion.js";
import { checkValue } from "./check-value.js";
import { Flaws } from "./flaws.js";
import { ordered } from "./order.js";
import { growAncestor, growLocal } from "./traverse/local.js";
import { growRecipe } from "./traverse/recipe.js";
import { coordinateOf, type Cursor, type Walk } from "./traverse/state.js";
import type { CssRule, RuleCoordinate, SkinFlaw, SkinRules, SketchRules, ValueVocabulary } from "./types.js";
import { vocabularyOf } from "./vocabulary.js";

export type {
  CssRule,
  RuleCoordinate,
  SkinFlaw,
  SkinFlawName,
  SkinRule,
  SkinRules,
  SketchRules,
  ValueVocabulary,
} from "./types.js";

export function skinRules(skin: Skin, lookup: PassportLookup, vocabulary: ValueVocabulary = {}): SkinRules {
  const done = trace(`skinRules(${skin.name})`);

  const known = vocabularyOf(skin, vocabulary);
  const flaws = new Flaws();
  const out: (CssRule & { coordinate: RuleCoordinate })[] = [];
  const walk: Walk<{ coordinate: RuleCoordinate }> = {
    lookup,
    known,
    homes: variableHomes(lookup, Object.keys(skin.recipes)),
    flaws,
    out,
    mark: coordinateOf,
  };

  if (!safeName(skin.name)) {
    flaws.add("unsafe-name", "name", `skin name "${skin.name}" is not fit for a selector`);
  }

  for (const bad of seedRefusals(skin.variables)) {
    flaws.add(
      "bad-seed",
      `variables.scales.${bad.scale}`,
      `${bad.means}. A ladder cannot be built from such a seed, and the steps of scale "${bad.scale}" ` +
        "are not considered declared",
    );
  }

  for (const bad of sizeRefusals(skin.variables)) {
    flaws.add("bad-size", `variables.dimensions.${bad.seed}`, bad.means);
  }

  for (const half of ["light", "dark"] as const) {
    for (const [name, value] of Object.entries(skin.variables?.[half] ?? {})) {
      const at = `variables.${half}.${name}`;
      if (!safeName(name)) flaws.add("unsafe-name", at, `name "${name}" is not fit for CSS`);
      else checkValue(value, at, known, flaws);
    }
  }

  for (const [component, recipe] of Object.entries(skin.recipes)) {
    const passport = lookup(component);
    const where = `recipes.${component}`;

    if (!passport) {
      flaws.add(
        "unknown-component",
        where,
        `there is no passport for component "${component}": no parts, states, or variant axis to read`,
      );
      continue;
    }

    growRecipe(passport, recipe, where, walk);
  }

  const appliedAt = motionSites(out, new Set(Object.keys(skin.keyframes ?? {})));

  for (const [name, frames] of Object.entries(skin.keyframes ?? {})) {
    if (!safeName(name)) {
      flaws.add("unsafe-name", `keyframes.${name}`, "motion name is not fit for CSS");
      continue;
    }

    const where = `keyframes.${name}`;
    checkKeyframeShape(frames, where, flaws);

    const sites = appliedAt.get(name) ?? [];

    if (sites.length === 0) {
      checkKeyframeReferences(frames, where, name, null, known, walk.homes, flaws);
      continue;
    }

    for (const site of sites) {
      const passport = lookup(site.component);

      checkKeyframeReferences(
        frames,
        where,
        name,
        site,
        passport ? new Set([...known, ...partVariables(passport, site.part)]) : known,
        walk.homes,
        flaws,
      );
    }
  }

  done();
  return { rules: ordered(out), flaws: flaws.list };
}

export function sketchRules(
  edits: readonly SketchEdit[],
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): SketchRules {
  const done = trace(`sketchRules(${edits.length})`);

  const known = vocabularyOf(undefined, vocabulary);
  const flaws = new Flaws();
  const out: CssRule[] = [];
  const walk: Walk<Record<never, never>> = {
    lookup,
    known,
    homes: variableHomes(lookup, edits.map((edit) => edit.component)),
    flaws,
    out,
    mark: () => ({}),
  };

  for (const [index, edit] of edits.entries()) {
    const where = `edits[${index}]`;
    const passport = lookup(edit.component);

    if (!passport) {
      flaws.add("unknown-component", where, `there is no passport for component "${edit.component}"`);
      continue;
    }

    if (!safeName(edit.node)) {
      flaws.add("unsafe-name", where, `node name "${edit.node}" is not fit for a selector`);
      continue;
    }

    if (partSelector(passport, edit.part) === undefined) {
      flaws.add("unknown-part", where, `component "${edit.component}" did not declare part "${edit.part}"`);
      continue;
    }

    const cursor: Cursor = {
      passport,
      part: edit.part,
      known: new Set([...known, ...partVariables(passport, edit.part)]),
      own: nodeSelector(edit.node),
      prefix: "",
      variants: [],
      states: [],
      unreliable: [],
      conditions: 0,
      origin: 0,
    };

    growLocal(cursor, edit.style, where, walk);

    for (const [i, ancestor] of (edit.style.ancestors ?? []).entries()) {
      growAncestor(cursor, ancestor, `${where}.ancestors[${i}]`, walk);
    }
  }

  done();
  return { rules: ordered(out), flaws: flaws.list };
}

export function checkSkin(skin: Skin, lookup: PassportLookup, vocabulary: ValueVocabulary = {}): readonly SkinFlaw[] {
  return skinRules(skin, lookup, vocabulary).flaws;
}

export function checkSketch(
  edits: readonly SketchEdit[],
  lookup: PassportLookup,
  vocabulary: ValueVocabulary = {},
): readonly SkinFlaw[] {
  return sketchRules(edits, lookup, vocabulary).flaws;
}
