import { describeSample, describeSchema, z, type PathType } from "@web-core/io";

/** Один из двух «вариантов» мода 4 — либо сырые данные (юзер дёрнул ручку, прилетело), либо
 *  zod-схема (форма потребителя) — юзер сам решает, что даёт, движку без разницы. */
export type MappingVariant = unknown;

/** Плоский список путей+типов одного варианта — `describeSchema`, если это реально схема
 *  (`instanceof z.ZodType`), иначе `describeSample` по сырым данным. Обе отдают одну и ту же
 *  форму (`PathType[]`), поэтому список полей строится одинаково для схемы и для сэмпла. */
export function describeVariant(variant: MappingVariant): readonly PathType[] {
  return variant instanceof z.ZodType ? describeSchema(variant) : describeSample(variant);
}
