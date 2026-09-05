
import { fluidPoles, isFluid, type FluidReport } from "../fluid/index.js";
import type { PassportLookup } from "../address/index.js";
import type { Keyframes, Skin } from "../recipe/index.js";
import { trace } from "../../trace/index.js";
import { checkOutfit } from "./check.js";
import { OutfitRefused } from "./refused.js";
import type { Assembled, LookParts, Outfit } from "./types.js";

export function assemble(outfit: Outfit, parts: LookParts, lookup: PassportLookup): Assembled {
  const done = trace(`assemble(${outfit.name})`);

  const flaws = checkOutfit(outfit, parts, lookup);
  if (flaws.length > 0) throw new OutfitRefused(outfit.name, flaws);

  const palette = parts.palettes.find((candidate) => candidate.name === outfit.palette)!;
  const forms = outfit.forms.map((name) => parts.forms.find((candidate) => candidate.name === name)!);

  const fluid = Object.entries(palette.dimensions ?? {})
    .filter(([, declaration]) => isFluid(declaration))
    .map(([seed, declaration]) => fluidPoles(seed, declaration as never))
    .filter((report): report is FluidReport => report !== null);

  const overridesBy: Record<string, number> = {};
  for (const [component, edits] of Object.entries(outfit.overrides ?? {})) {
    overridesBy[component] = Object.keys(edits).length;
  }

  const skin: Skin = {
    name: outfit.name,
    variables: {
      scales: palette.scales,
      dimensions: palette.dimensions,
      light: palette.light,
      dark: palette.dark,
    },
    recipes: Object.fromEntries(forms.map((form) => [form.component, form.recipe])),
    keyframes: Object.assign({}, ...forms.map((form) => form.keyframes ?? {})) as Keyframes,
    overrides: outfit.overrides,
  };

  done();
  return {
    skin,
    report: {
      palette: palette.name,
      dressed: forms.map((form) => form.component).toSorted(),
      overrides: Object.values(overridesBy).reduce((sum, count) => sum + count, 0),
      overridesBy,
      fluid,
    },
  };
}
