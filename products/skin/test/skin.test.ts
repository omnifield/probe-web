// СКИН, ПРИШЕДШИЙ ИЗ СЛУЖБЫ (`PWEB-31`, первая половина гейта).
//
// Проверяется путь записи, а не её содержимое: содержимое живёт в службе, и что там написано —
// дело автора скина. Зона отвечает за другое:
//
//   1. запись, полученная из службы, **собирается генератором** — то есть шов «служба → модель»
//      цел, и JSON ничего по дороге не потерял;
//   2. порождённый CSS адресует **координатами** из анатомии — за это и цепляется скин;
//   3. в коде зоны **нет ни одного скина**: ни перечня, ни семени, ни встроенного.
//
// Третье — не придирка. Встроенное содержимое означало бы, что человек не отличает «служба
// отдала мой скин» от «показываю своё», и расхождение он нашёл бы у коллеги, а не у себя.

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { DARK_CLASS, FORCE_ATTRIBUTE, SKIN_LAYER } from "@omnifield/probe-web-skin/model";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SKIN_SOURCE } from "../src/skins/index.js";
import { FORM, OUTFIT, PALETTE } from "./fixtures.js";
import { restoreStore, serveLook } from "./store-stub.js";

beforeEach(() => serveLook({ palettes: [PALETTE], forms: [FORM], outfits: [OUTFIT] }));
afterEach(restoreStore);

/** Исходники зоны — для проверок «чего в них нет». */
function sources(): { path: string; text: string }[] {
  const dir = resolve(process.cwd(), "src/skins");

  return readdirSync(dir).map((name) => ({
    path: name,
    text: readFileSync(resolve(dir, name), "utf8"),
  }));
}

describe("запись доезжает из службы и собирается", () => {
  it("источник отдаёт готовый текст стилей", async () => {
    const css = await SKIN_SOURCE.css(OUTFIT.name);

    expect(css).toContain(`@layer ${SKIN_LAYER}`);
    expect(css.length).toBeGreaterThan(100);
  });

  it("часть адресована парой атрибутов из анатомии", async () => {
    const css = await SKIN_SOURCE.css(OUTFIT.name);

    expect(css).toContain('[data-scope="button"][data-part="root"]');
  });

  it("вариации — именами, которые объявил сам скин", async () => {
    const css = await SKIN_SOURCE.css(OUTFIT.name);

    for (const name of Object.keys(FORM.recipe.variants ?? {})) {
      // Умолчание сводится с отсутствием атрибута, поэтому его имя ищем в паре с `:not`.
      expect(css).toContain(`[data-variant="${name}"]`);
    }
  });

  it("состояние кита — атрибутом, состояние браузера — псевдоклассом с признаком", async () => {
    const css = await SKIN_SOURCE.css(OUTFIT.name);

    expect(css).toContain("[data-disabled]");
    expect(css).toContain(":hover");
    expect(css).toContain(FORCE_ATTRIBUTE);
  });

  it("тёмная половина следует за режимом", async () => {
    const css = await SKIN_SOURCE.css(OUTFIT.name);

    //半 половины строит палитра: семя даёт обе, и тёмная цепляется за класс режима.
    expect(css).toContain(DARK_CLASS);
    expect(css).toContain("--акцент-9");
  });

  it("имени, которого в службе нет, отказывают", async () => {
    await expect(SKIN_SOURCE.css("нет-такого")).rejects.toThrow();
  });
});

describe("в коде зоны скинов нет", () => {
  it("в источнике нет ни одной записи вида", () => {
    for (const { path, text } of sources()) {
      const withoutComments = text.replaceAll(/\/\/.*$/gm, "").replaceAll(/\/\*[\s\S]*?\*\//g, "");

      // Запись скина узнаётся по своим полям: рецепты и переменные. Тип-импорт `Skin` при этом
      // законен — разбор ответа службы обязан её называть.
      expect(withoutComments, path).not.toMatch(/recipe\s*:/);
      expect(withoutComments, path).not.toMatch(/defaultVariant\s*:/);
      expect(withoutComments, path).not.toMatch(/scales\s*:/);
    }
  });

  it("перечень нарядов запрашивается, а не объявляется", () => {
    const index = sources().find((file) => file.path === "index.ts");

    expect(index?.text).toContain("listOutfits");
    expect(index?.text).not.toMatch(/const OUTFITS|Record<string, Outfit>/);
  });

  it("сборка зовётся у механики, своей в зоне нет", () => {
    const index = sources().find((file) => file.path === "index.ts");

    // Вторая правда о законности наряда разошлась бы с первой молча.
    expect(index?.text).toContain("assemble");
    expect(index?.text).not.toMatch(/function assemble\b/);
  });

  it("команды засева нет — скины делает человек", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };

    expect(Object.keys(manifest.scripts ?? {})).not.toContain("seed:skins");
  });
});
