import type { Form, Palette } from "@web-core/skin/model";
import { checkTags as checkTagsPure, type TagFlaw } from "@web-core/skin/tags";
import { skin } from "./mechanics";
import { list, readPalettes } from "./store";

export type { TagFlaw };

export async function checkTags(tags: readonly string[], where = "tags"): Promise<TagFlaw[]> {
  const known = new Set((await list("tag")).map((record) => record.name).filter((name): name is string => name !== undefined));
  return checkTagsPure(tags, known, where);
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
