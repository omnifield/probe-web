
import { anyOf, markSelector, safeName, variantAlternatives, variantSelector } from "../../address/index.js";
import type { ComponentPassport, PassportSetting } from "../../passport/form/index.js";
import type { CompoundVariant, PartStyle, PartStyles, SlotRecipe } from "../../recipe/index.js";
import { growParts } from "./part.js";
import { ANY_VARIANT, type Walk } from "./state.js";

export function growRecipe<Mark>(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  where: string,
  walk: Walk<Mark>,
): void {
  const names = Object.keys(recipe.variants ?? {});

  if (names.length > 0 && recipe.defaultVariant === undefined) {
    walk.flaws.add(
      "default-missing",
      where,
      "variants are declared, but no default. Then \"the main one\" and \"no attribute\" are two " +
        "different addresses that only match by an agreement nowhere in a file",
    );
  }

  if (recipe.defaultVariant !== undefined && !names.includes(recipe.defaultVariant)) {
    walk.flaws.add(
      "unknown-variant",
      `${where}.defaultVariant`,
      `default names variant "${recipe.defaultVariant}", which is not in the recipe`,
    );
  }

  if (recipe.base) {
    growParts(passport, ANY_VARIANT, 0, recipe.base, `${where}.base`, walk);
  }

  for (const [name, parts] of Object.entries(recipe.variants ?? {})) {
    const at = `${where}.variants.${name}`;

    if (!safeName(name)) {
      walk.flaws.add("unsafe-name", at, `variant name "${name}" is not fit for a selector`);
      continue;
    }

    const selector = variantSelector(passport, name, name === recipe.defaultVariant);

    if (selector === undefined) {
      walk.flaws.add(
        "variant-unaddressable",
        at,
        `component "${passport.component}"'s variant axis is not expressed by an attribute — the ` +
          "variant name never reaches markup, and there's nothing to address it by",
      );
      continue;
    }

    growParts(passport, { selector, names: [name] }, 1, parts, at, walk);
  }

  growSettings(passport, recipe, where, walk);

  for (const [index, compound] of (recipe.compoundVariants ?? []).entries()) {
    growCompound(passport, recipe, compound, `${where}.compoundVariants[${index}]`, walk);
  }
}

export function growSettings<Mark>(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  where: string,
  walk: Walk<Mark>,
): void {
  for (const [name, byValue] of Object.entries(recipe.settings ?? {})) {
    const at = `${where}.settings.${name}`;
    const declared = passport.settings?.[name];

    if (declared === undefined) {
      walk.flaws.add(
        "unknown-setting",
        at,
        `component "${passport.component}" did not declare setting "${name}". The list of settings ` +
          "is closed and belongs to whoever wrote the component: a rule keyed by a made-up name " +
          "addresses something the component doesn't have",
      );
      continue;
    }

    if (declared.mark === undefined) {
      walk.flaws.add(
        "setting-unaddressable",
        at,
        `setting "${name}" of component "${passport.component}" declared no place in markup ` +
          "(`PassportSetting.mark`): it changes behavior and leaves no trace for a look to hook " +
          "into. Nothing to address — the rule would land on no node at all",
      );
      continue;
    }

    if (declared.mark.kind !== "attribute") {
      walk.flaws.add(
        "setting-unaddressable",
        at,
        `setting "${name}" of component "${passport.component}" is not expressed by an attribute ` +
          "— its value never reaches markup, and there's nothing to address it by",
      );
      continue;
    }

    for (const [value, parts] of Object.entries(byValue)) {
      const at2 = `${at}.${value}`;

      if (!settingValues(declared).includes(value)) {
        walk.flaws.add(
          "unknown-setting",
          at2,
          `setting "${name}" does not accept value "${value}". Accepts — ` +
            `${settingValues(declared).join(", ")}; a rule for a foreign value lands nowhere`,
        );
        continue;
      }

      growParts(
        passport,
        {
          selector: markSelector(value, { ...declared.mark, value: declared.mark.value ?? value }),
          names: [],
          settings: { [name]: value },
        },
        1,
        parts,
        at2,
        walk,
      );
    }
  }
}

function settingValues(setting: PassportSetting): string[] {
  return setting.values.kind === "choice" ? setting.values.options.map((option) => option.value) : ["true", "false"];
}

export function growCompound<Mark>(
  passport: ComponentPassport,
  recipe: SlotRecipe,
  compound: CompoundVariant,
  where: string,
  walk: Walk<Mark>,
): void {
  const chosen = compound.variants ?? [];
  const unknown = chosen.filter((name) => !(name in (recipe.variants ?? {})));

  if (unknown.length > 0) {
    walk.flaws.add(
      "unknown-variant",
      where,
      `compound names variants that are not in the recipe: ${unknown.join(", ")}`,
    );
    return;
  }

  const options = chosen.flatMap(
    (name) => variantAlternatives(passport, name, name === recipe.defaultVariant) ?? [undefined],
  );

  if (options.some((option) => option === undefined)) {
    walk.flaws.add(
      "variant-unaddressable",
      where,
      `component "${passport.component}"'s variant axis is not expressed by an attribute`,
    );
    return;
  }

  const variant = anyOf(options as string[])!;

  const wrapped: PartStyles = Object.fromEntries(
    Object.entries(compound.style)
      .filter((entry): entry is [string, PartStyle] => entry[1] !== undefined)
      .map(([part, style]) => [
        part,
        (compound.states ?? []).reduceRight<PartStyle>((inner, state) => ({ states: { [state]: inner } }), style),
      ]),
  );

  growParts(passport, { selector: variant, names: chosen }, 2, wrapped, where, walk);
}
