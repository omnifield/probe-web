// Design notes: ./README.md#references

import { motionsIn } from "../motion/index.js";
import type { LocalStyle, PartStyle, PartStyles, SlotRecipe, StyleObject } from "../recipe/index.js";
import { bare } from "./bare.js";
import type { Form } from "./types.js";

export interface FormReference {
  readonly name: string;
  readonly part: string | null;
  readonly where: string;
  readonly movement?: string;
}

function propsIn(style: LocalStyle | PartStyle): StyleObject[] {
  const found: StyleObject[] = [];

  if (style.props) found.push(style.props);
  for (const nested of Object.values(style.states ?? {})) found.push(...propsIn(nested));
  for (const ancestor of (style as PartStyle).ancestors ?? []) found.push(...propsIn(ancestor.style));

  return found;
}

function recipeGroups(recipe: SlotRecipe): { where: string; styles: PartStyles }[] {
  const groups: { where: string; styles: PartStyles }[] = [];

  if (recipe.base) groups.push({ where: "base", styles: recipe.base });

  for (const [setting, byValue] of Object.entries(recipe.settings ?? {})) {
    for (const [value, styles] of Object.entries(byValue)) {
      groups.push({ where: `settings.${setting}.${value}`, styles });
    }
  }

  for (const [name, styles] of Object.entries(recipe.variants ?? {})) {
    groups.push({ where: `variants.${name}`, styles });
  }

  (recipe.compoundVariants ?? []).forEach((compound, index) => {
    groups.push({ where: `compoundVariants[${index}]`, styles: compound.style });
  });

  return groups;
}

function motionParts(form: Form): Map<string, Set<string>> {
  const declared = new Set(Object.keys(form.keyframes ?? {}));
  const found = new Map<string, Set<string>>();

  if (declared.size === 0) return found;

  for (const { styles } of recipeGroups(form.recipe)) {
    for (const [part, style] of Object.entries(styles)) {
      if (style === undefined) continue;

      for (const props of propsIn(style)) {
        for (const movement of motionsIn(props, declared)) {
          found.set(movement, (found.get(movement) ?? new Set<string>()).add(part));
        }
      }
    }
  }

  return found;
}

function refsIn(value: unknown): string[] {
  return [...JSON.stringify(value ?? null).matchAll(/var\(\s*(--[^\s,)]+)/gu)].map((m) => bare(m[1]!));
}

export function formRefs(form: Form): FormReference[] {
  const found: FormReference[] = [];

  for (const { where, styles } of recipeGroups(form.recipe)) {
    for (const [part, style] of Object.entries(styles)) {
      for (const name of refsIn(style)) found.push({ name, part, where: `${where}.${part}` });
    }
  }

  const appliedAt = motionParts(form);

  for (const [movement, frames] of Object.entries(form.keyframes ?? {})) {
    const applicableParts = [...(appliedAt.get(movement) ?? [])];
    const where = `keyframes.${movement}`;

    for (const name of refsIn(frames)) {
      if (applicableParts.length === 0) {
        found.push({ name, part: null, where });
        continue;
      }

      for (const part of applicableParts) found.push({ name, part, where, movement });
    }
  }

  return found;
}
