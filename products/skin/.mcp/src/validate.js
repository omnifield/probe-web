// ПРОВЕРКА ОДИНОЧНОЙ ПАЛИТРЫ/ФОРМЫ — своей функции у механики для этого нет (`checkOutfit`
// проверяет наряд, `checkSkin` — уже собранный скин), и заводить вторую здесь означало бы второй
// источник правды о том же вопросе (довод `PWEB-94`, README `packages/skin`). Вместо этого —
// СИНТЕТИЧЕСКИЙ наряд из одной записи: `checkOutfit` проверяет палитру безусловно
// (`packages/skin/src/look/check.ts`, блок `if (palette)` не зависит от списка форм), поэтому
// наряд с пустым `forms` — это честная проверка одной палитры тем же путём, каким служба
// проверяет её внутри настоящего наряда, не приближением.
//
// Форма проверяется в два прохода, потому что и механика это делает в два прохода: `checkOutfit`
// ловит опечатку в ИМЕНИ роли/переменной (форма просит то, чего нет ни в паспорте, ни в словаре),
// а `checkSkin` — опечатку в АДРЕСЕ (несуществующая часть/состояние/настройка внутри `recipe`).
// Между ними стоит `assemble`, который и сам механикой не пропустит наряд с флавами первого рода
// дальше (`OutfitRefused`) — значит второй проход стоит делать, только когда первый чист.

import { skin } from "./mechanics.js";
import { readForms, readPalettes } from "./store.js";

/** @param {import("@omnifield/probe-web-skin/model").Palette} palette */
export async function checkPalette(palette) {
  const palettes = await readPalettes();
  const parts = { palettes: [...palettes.filter((p) => p.name !== palette.name), palette], forms: [] };
  const outfit = { name: "__mcp_check__", palette: palette.name, forms: [] };

  const flaws = skin.checkOutfit(outfit, parts);
  return { ok: flaws.length === 0, flaws };
}

/**
 * @param {import("@omnifield/probe-web-skin/model").Form} form
 * @param {string} [paletteName] палитра, на роли которой проверяются ссылки формы; не назвали —
 *   берётся первая из службы. Ни одной в службе — реф-проверка ролей невозможна, флав об этом
 *   называется явно, а не молчаливо пропускается.
 */
export async function checkForm(form, paletteName) {
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
