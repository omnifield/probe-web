// Design notes: ./README.md#check

import type { PassportLookup } from "../address/index.js";
import { trace } from "../trace/index.js";
import { homesText, partVariables, variableHomes } from "../variables/index.js";
import { knownRole, SCALE_ROLES, VOCABULARY } from "../vocabulary/index.js";
import { closedByDimensions, closedByScales, paletteValues, summarizeByFamily } from "./coverage.js";
import { formRefs } from "./references.js";
import type { LookParts, Outfit, OutfitFlaw } from "./types.js";

export function checkOutfit(outfit: Outfit, parts: LookParts, lookup: PassportLookup): readonly OutfitFlaw[] {
  const done = trace(`checkOutfit(${outfit.name})`);
  const flaws: OutfitFlaw[] = [];
  const homes = variableHomes(
    lookup,
    parts.forms.filter((form) => outfit.forms.includes(form.name)).map((form) => form.component),
  );

  const palette = parts.palettes.find((candidate) => candidate.name === outfit.palette);

  if (!palette) {
    flaws.push({
      name: "unknown-palette",
      where: "palette",
      means:
        `there is no palette "${outfit.palette}" in the source. The outfit refers by NAME, and a ` +
        "name nobody hands out is a look that won't happen",
    });
  }

  if (palette) {
    for (const scale of Object.keys(palette.scales ?? {})) {
      if (!SCALE_ROLES.includes(scale)) {
        flaws.push({
          name: "outside-vocabulary",
          where: `palette.scales.${scale}`,
          means:
            `the palette declares scale "${scale}", which is not in the vocabulary. Scale roles ` +
            `are declared by purpose (${SCALE_ROLES.join(", ")}), and a form will only ask for those`,
        });
      }
    }

    for (const role of paletteValues(palette)) {
      if (!knownRole(role)) {
        flaws.push({
          name: "outside-vocabulary",
          where: `palette.${role}`,
          means:
            `the palette declares role "${role}", which is not in the vocabulary. No form will be ` +
            "able to ask for it — the value will go nowhere, and quietly",
        });
      }
    }

    const closed = new Set([...paletteValues(palette), ...closedByScales(palette), ...closedByDimensions(palette)]);
    const missing = VOCABULARY.filter((role) => !closed.has(role.name)).map((role) => role.name);

    if (missing.length > 0) {
      flaws.push({
        name: "palette-incomplete",
        where: "palette",
        means:
          `palette "${palette.name}" did not close the vocabulary: ${missing.length} role(s) not ` +
          `set — ${summarizeByFamily(missing)}. A form written for a different palette would ` +
          "silently lose part of its values on this one",
      });
    }
  }

  const claimed = new Map<string, string>();

  outfit.forms.forEach((name, index) => {
    const form = parts.forms.find((candidate) => candidate.name === name);

    if (!form) {
      flaws.push({
        name: "unknown-form",
        where: `forms[${index}]`,
        means: `there is no form "${name}" in the source — the outfit refers to something nobody hands out`,
      });
      return;
    }

    const previousName = claimed.get(form.component);
    if (previousName !== undefined) {
      flaws.push({
        name: "component-twice",
        where: `forms[${index}]`,
        means:
          `the outfit named two forms for component "${form.component}" — "${previousName}" and ` +
          `"${name}". The outfit doesn't say which look wins, and the cascade would answer by ` +
          "order — that is, by chance",
      });
      return;
    }

    claimed.set(form.component, name);

    const passport = lookup(form.component);

    if (!passport) {
      flaws.push({
        name: "unknown-component",
        where: `forms[${index}]`,
        means:
          `there is no passport for component "${form.component}": no parts, states, or declared ` +
          "variables to read. Fixed in the kit — by declaring a passport, not in the palette",
      });
      return;
    }

    for (const reference of formRefs(form)) {
      if (knownRole(reference.name)) continue;

      if (reference.part && partVariables(passport, reference.part).has(`--${reference.name}`)) continue;

      const prefix = reference.movement
        ? `motion "${reference.movement}" is applied on part "${reference.part}", and `
        : "";

      const home = homes.get(`--${reference.name}`);
      if (home) {
        flaws.push({
          name: "variable-elsewhere",
          where: `forms[${index}].${reference.where}.${reference.name}`,
          means:
            `${prefix}variable "--${reference.name}" is declared by the passport, but on a ` +
            `different part — ${homesText(home)}. Nobody sets it here: the rule will land on the ` +
            "page with an unresolved value. Move the rule to that part, or address it through an ancestor",
        });
        continue;
      }

      flaws.push({
        name: "outside-vocabulary",
        where: `forms[${index}].${reference.where}.${reference.name}`,
        means:
          `${prefix}the form asks for role "${reference.name}", which is in neither the ` +
          "vocabulary nor the passport. No palette will supply it, and the rule will land on the " +
          "page with an unresolved value",
      });
    }
  });

  for (const [component, edits] of Object.entries(outfit.overrides ?? {})) {
    if (!lookup(component)) {
      flaws.push({
        name: "unknown-component",
        where: `overrides.${component}`,
        means:
          `there is no passport for component "${component}": there's nothing to build an ` +
          "override's address from, and it won't reach the page at all. Fixed in the kit — by declaring a passport",
      });
    }

    for (const role of Object.keys(edits)) {
      if (!knownRole(role)) {
        flaws.push({
          name: "outside-vocabulary",
          where: `overrides.${component}.${role}`,
          means:
            `the override declares role "${role}", which is not in the vocabulary. Nothing to ` +
            "override: no palette sets this role and no form asks for it",
        });
      }
    }
  }

  done();
  return flaws;
}
