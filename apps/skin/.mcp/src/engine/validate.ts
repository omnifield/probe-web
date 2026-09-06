import type { Form, Palette } from "@web-core/skin/model";
import { skin } from "./mechanics";
import { list, readPalettes } from "./store";

export interface TagFlaw {
  readonly name: "unknown-tag";
  readonly where: "tags";
  readonly means: string;
}

export async function checkTags(tags: readonly string[]): Promise<TagFlaw[]> {
  const known = new Set((await list("tag")).map((record) => record.name));
  return tags
    .filter((tag) => !known.has(tag))
    .map((tag) => ({
      name: "unknown-tag" as const,
      where: "tags" as const,
      means: `тега "${tag}" нет в словаре — заведите его записью kind:"tag" или возьмите существующий из list_presets({kind:"tag"})`,
    }));
}

export async function checkPalette(palette: Palette) {
  const palettes = await readPalettes();
  const parts = { palettes: [...palettes.filter((p) => p.name !== palette.name), palette], forms: [] };
  const outfit = { name: "__mcp_check__", palette: palette.name, forms: [] };

  const flaws = skin.checkOutfit(outfit, parts);
  return { ok: flaws.length === 0, flaws };
}

export async function checkForm(form: Form, paletteName?: string) {
  const palettes = await readPalettes();
  const palette = paletteName ? palettes.find((p) => p.name === paletteName) : palettes[0];

  if (!palette) {
    return {
      ok: false,
      referenceFlaws: [
        {
          name: "unknown-palette",
          where: "palette",
          means: "в службе нет ни одной палитры — форму не с чем сверить по ролям. Создайте палитру и укажите её имя",
        },
      ],
      structuralFlaws: [],
    };
  }

  const outfit = { name: "__mcp_check__", palette: palette.name, forms: [form.name] };
  const parts = { palettes: [palette], forms: [form] };

  const referenceFlaws = skin.checkOutfit(outfit, parts);
  if (referenceFlaws.length > 0) return { ok: false, referenceFlaws, structuralFlaws: [] };

  const assembled = skin.assemble(outfit, parts);
  const structuralFlaws = skin.checkSkin(assembled.skin);

  return {
    ok: structuralFlaws.length === 0,
    referenceFlaws,
    structuralFlaws,
    css: structuralFlaws.length === 0 ? skin.generateSkinCss(assembled.skin) : undefined,
  };
}
