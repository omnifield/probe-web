// Схемы для toolDefinition()-обёрток (`./index.ts`) — зеркалят TS-типы движка через `z.ZodType<T>`,
// компилятор проверяет соответствие сам. Паспорт/lookup сюда намеренно не входят: `PassportAnatomy`
// несёт функции (`keys()`/`build()` из `@zag-js/anatomy`), JSON ими быть не может — это знание живого
// реестра компонентов, инфраструктура вызова, не значение, которое агент выбирает по вызову. Разбор —
// FAQ.md.

import { z } from "@web-core/io";
import type {
  AncestorStyle,
  CompoundVariant,
  Keyframes,
  LocalStyle,
  PartStyle,
  PartStyles,
  ScaleDeclaration,
  SeededScale,
  Skin,
  SkinVariables,
  SlotRecipe,
  StyleObject,
} from "../engine/recipe/index.js";
import type { DimensionSeed, FluidPole, FluidReport, FluidSeed } from "../engine/fluid/index.js";
import type { Assembled, Form, LookParts, Outfit, OutfitFlaw, OutfitFlawName, OutfitReport, Palette } from "../engine/look/index.js";
import type { SkinGap } from "../engine/coverage/index.js";
import type { ValueVocabulary } from "../engine/rules/index.js";

export const StyleValueSchema = z.union([z.string(), z.number()]);

export const StyleObjectSchema: z.ZodType<StyleObject> = z.lazy(() =>
  z.record(z.string(), z.union([StyleValueSchema, StyleObjectSchema])),
);

export const LocalStyleSchema: z.ZodType<LocalStyle> = z.lazy(() =>
  z.object({
    props: StyleObjectSchema.optional(),
    states: z.record(z.string(), LocalStyleSchema).optional(),
  }),
);

export const AncestorStyleSchema: z.ZodType<AncestorStyle> = z.object({
  component: z.string(),
  part: z.string(),
  states: z.array(z.string()).optional(),
  style: LocalStyleSchema,
});

export const PartStyleSchema: z.ZodType<PartStyle> = z.lazy(() =>
  z.object({
    props: StyleObjectSchema.optional(),
    states: z.record(z.string(), LocalStyleSchema).optional(),
    ancestors: z.array(AncestorStyleSchema).optional(),
  }),
);

export const PartStylesSchema: z.ZodType<PartStyles> = z.record(z.string(), PartStyleSchema);

export const CompoundVariantSchema: z.ZodType<CompoundVariant> = z.object({
  variants: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  style: PartStylesSchema,
});

export const SlotRecipeSchema: z.ZodType<SlotRecipe> = z.object({
  base: PartStylesSchema.optional(),
  variants: z.record(z.string(), PartStylesSchema).optional(),
  defaultVariant: z.string().optional(),
  settings: z.record(z.string(), z.record(z.string(), PartStylesSchema)).optional(),
  compoundVariants: z.array(CompoundVariantSchema).optional(),
});

export const KeyframesSchema: z.ZodType<Keyframes> = z.record(z.string(), StyleObjectSchema);

export const SeededScaleSchema: z.ZodType<SeededScale> = z.object({
  seed: z.string(),
  alpha: z.boolean().optional(),
  chart: z.boolean().optional(),
  scrim: z.boolean().optional(),
});

export const ScaleDeclarationSchema: z.ZodType<ScaleDeclaration> = z.union([z.string(), SeededScaleSchema]);

export const FluidSeedSchema: z.ZodType<FluidSeed> = z.object({
  narrow: z.string(),
  wide: z.string(),
  between: z.tuple([z.string(), z.string()]),
});

export const DimensionSeedSchema: z.ZodType<DimensionSeed> = z.union([z.string(), FluidSeedSchema]);

// Общая форма полей — вынесена, чтобы Palette (SkinVariables + name/author) не звала `.extend()`:
// аннотация `z.ZodType<T>` ниже стирает конкретный подкласс `ZodObject`, метода на нём уже нет.
const skinVariablesShape = {
  scales: z.record(z.string(), ScaleDeclarationSchema).optional(),
  dimensions: z.record(z.string(), DimensionSeedSchema).optional(),
  light: z.record(z.string(), z.string()).optional(),
  dark: z.record(z.string(), z.string()).optional(),
};

export const SkinVariablesSchema: z.ZodType<SkinVariables> = z.object(skinVariablesShape);

export const PaletteSchema: z.ZodType<Palette> = z.object({
  ...skinVariablesShape,
  name: z.string(),
  author: z.string().optional(),
});

export const FormSchema: z.ZodType<Form> = z.object({
  name: z.string(),
  component: z.string(),
  recipe: SlotRecipeSchema,
  keyframes: KeyframesSchema.optional(),
  variantTags: z.record(z.string(), z.array(z.string())).optional(),
  author: z.string().optional(),
});

export const OutfitSchema: z.ZodType<Outfit> = z.object({
  name: z.string(),
  palette: z.string(),
  forms: z.array(z.string()),
  overrides: z.record(z.string(), z.record(z.string(), z.string())).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
});

export const LookPartsSchema: z.ZodType<LookParts> = z.object({
  palettes: z.array(PaletteSchema),
  forms: z.array(FormSchema),
});

const OUTFIT_FLAW_NAMES = [
  "unknown-palette",
  "unknown-form",
  "unknown-component",
  "outside-vocabulary",
  "palette-incomplete",
  "component-twice",
  "variable-elsewhere",
  "keyframe-collision",
] as const satisfies readonly OutfitFlawName[];

export const OutfitFlawNameSchema: z.ZodType<OutfitFlawName> = z.enum(OUTFIT_FLAW_NAMES);

export const OutfitFlawSchema: z.ZodType<OutfitFlaw> = z.object({
  name: OutfitFlawNameSchema,
  where: z.string(),
  means: z.string(),
  missing: z.array(z.string()).optional(),
});

export const FluidPoleSchema: z.ZodType<FluidPole> = z.object({
  value: z.string(),
  px: z.number(),
});

export const FluidReportSchema: z.ZodType<FluidReport> = z.object({
  seed: z.string(),
  narrow: FluidPoleSchema,
  wide: FluidPoleSchema,
});

export const OutfitReportSchema: z.ZodType<OutfitReport> = z.object({
  palette: z.string(),
  dressed: z.array(z.string()),
  overrides: z.number(),
  overridesBy: z.record(z.string(), z.number()),
  fluid: z.array(FluidReportSchema),
});

export const SkinSchema: z.ZodType<Skin> = z.object({
  name: z.string(),
  variables: SkinVariablesSchema.optional(),
  recipes: z.record(z.string(), SlotRecipeSchema),
  keyframes: KeyframesSchema.optional(),
  overrides: z.record(z.string(), z.record(z.string(), z.string())).optional(),
});

export const AssembledSchema: z.ZodType<Assembled> = z.object({
  skin: SkinSchema,
  report: OutfitReportSchema,
});

export const SkinGapSchema: z.ZodType<SkinGap> = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("component"), component: z.string(), means: z.string() }),
  z.object({ kind: z.literal("part"), component: z.string(), part: z.string(), means: z.string() }),
  z.object({ kind: z.literal("state"), component: z.string(), part: z.string(), state: z.string(), means: z.string() }),
]);

export const ValueVocabularySchema: z.ZodType<ValueVocabulary> = z.object({
  tokens: z.array(z.string()).optional(),
});
