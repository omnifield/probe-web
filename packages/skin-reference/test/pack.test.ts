// ГЕЙТ ПОСТАВКИ: что уедет в тарбол, что из него разрешится и — главное — РАБОТАЕТ ли оно там.
//
// Манифест расходится с фактом МОЛЧА: `files`, `exports` и то, что реально разрешится у
// потребителя, — три разные вещи, и узнаёт об этом он, а не мы. Здесь пакет действительно
// упаковывается, действительно распаковывается и действительно импортируется ОТДЕЛЬНЫМ
// процессом, которому наш `node_modules` не виден.
//
// ## Положительный контроль — половина гейта, а не украшение
//
// «Импортируется» для записи данных значит слишком мало: импортироваться будет и пустой объект.
// Поэтому в той же установке эталон ПРОХОДИТ МЕХАНИКУ — порождает CSS, — а рядом стоит контроль
// на красноту: испорченная копия записи получает отказ. Без него зелёный прогон значил бы и
// «работает», и «проверка ни до чего не дошла».

import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PKG, installFromTarball, link, pkgRoot, runInInstall } from "./helpers/install.js";

let work: string;
let install: string;
let entries: string[];

beforeAll(() => {
  ({ work, install, entries } = installFromTarball("probe-web-skin-reference-pack-"));

  // Механика и кит — ОБЯЗАТЕЛЬНЫЕ одноранговые: запись без них не проверить и не породить.
  link(install, "@omnifield/probe-web-skin");
  link(install, "@omnifield/probe-web-ui");
  link(install, "@omnifield/probe-web-style");
}, 120_000);

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("что уезжает в тарбол", () => {
  it("везёт сборку входа и типы", () => {
    expect(entries).toEqual(
      expect.arrayContaining(["dist/index.js", "dist/index.d.ts", "package.json", "README.md"]),
    );
  });

  it("исходников, проб и оснастки в тарболе нет", () => {
    const leaked = entries.filter(
      (entry) =>
        entry.startsWith("src/") ||
        entry.startsWith("test/") ||
        entry.startsWith("scripts/") ||
        entry.startsWith("tsconfig"),
    );

    expect(leaked).toEqual([]);
  });

  it("установка состоит только из поставки", () => {
    expect(readdirSync(join(install, "node_modules", PKG)).toSorted()).toEqual([
      "README.md",
      "dist",
      "package.json",
    ]);
  });

  it("ни одного файла стилей: эталон — ЗАПИСЬ, а не лист", () => {
    // Гейт формы поставки. Уедь отсюда `.css`, фреймворк снова одевал бы сбоку, просто под
    // другим именем, и заметить это по манифесту было бы нельзя.
    expect(entries.filter((entry) => entry.endsWith(".css"))).toEqual([]);
  });
});

describe("в чистой установке эталон работает, а не только импортируется", () => {
  it("три записи разрешаются, и наряд ссылается на палитру именем", () => {
    const printed = runInInstall(
      install,
      `import { referenceOutfit, referencePalette, referenceForms, DRESSED } from ${JSON.stringify(PKG)};
       console.log([referenceOutfit.name, DRESSED.length, referenceForms.length, referenceOutfit.palette === referencePalette.name].join(" "));`,
    );

    expect(printed).toBe("reference 5 5 true");
  });

  it("МЕХАНИКА СОБИРАЕТ И ПОРОЖДАЕТ — вот это и есть «работает»", () => {
    const printed = runInInstall(
      install,
      `import { referenceOutfit, referencePalette, referenceForms } from ${JSON.stringify(PKG)};
       import { withPassports } from "@omnifield/probe-web-skin";
       import { passportOf } from "@omnifield/probe-web-ui/passport";
       const { assemble, checkSkin, generateSkinCss } = withPassports(passportOf);
       const { skin, report } = assemble(referenceOutfit, { palettes: [referencePalette], forms: referenceForms });
       const flaws = checkSkin(skin);
       const css = generateSkinCss(skin);
       process.stdout.write([flaws.length, report.dressed.length, css.includes("--акцент-9:"), css.includes("color-scheme: light")].join(" "));`,
    );

    expect(printed).toBe("0 5 true true");
  });

  it("положительный контроль: испорченная запись в ТОЙ ЖЕ установке получает отказ", () => {
    // Без него зелёные две пробы выше значили бы и «работает», и «до проверки не дошло».
    const refused = runInInstall(
      install,
      `import { referenceOutfit, referencePalette, referenceForms } from ${JSON.stringify(PKG)};
       import { withPassports } from "@omnifield/probe-web-skin";
       import { passportOf } from "@omnifield/probe-web-ui/passport";
       const { assemble, generateSkinCss } = withPassports(passportOf);
       const порча = { ...referencePalette, scales: { ...referencePalette.scales, акцент: "не-цвет" } };
       const { skin } = assemble(referenceOutfit, { palettes: [порча], forms: referenceForms });
       generateSkinCss(skin);`,
    );

    expect(refused).toMatch(/^ОТКАЗ:/);
    expect(refused).toMatch(/не порождён/);
  });
});

describe("манифест описывает то же, что уехало", () => {
  it("обычных зависимостей нет: эталон не привозит с собой ничего", () => {
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };

    expect(manifest.dependencies).toBeUndefined();
    // Ни одна одноранговая не объявлена НЕОБЯЗАТЕЛЬНОЙ: без механики запись бессмысленна, без
    // кита её адреса не проверить. «Необязательно» здесь было бы неправдой.
    expect(manifest.peerDependenciesMeta).toBeUndefined();
  });
});
