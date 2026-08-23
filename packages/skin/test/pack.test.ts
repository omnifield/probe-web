// ГЕЙТ ПОСТАВКИ: что уедет в тарбол, что из него разрешится и — главное — **чем за это платят**.
//
// ## Что здесь доказывается
//
// Вложенная форма объявлена основной: браузер разворачивает вложенность сам, и витрине с
// редактором разворачиватель не нужен. Плоская живёт за подпутём `./flat`.
//
// До `PWEB-48` подпуть был отделён, а ЦЕНА нет: `postcss` стоял обычной зависимостью и приезжал
// каждому, кто взял только вложенную. Обещание выполнялось в коде и не выполнялось при установке.
//
// Проверяется это ЗАПУСКОМ в установке, где разворачивателя физически нет, а не чтением
// манифеста: манифест расходится с фактом молча — `files`, `exports` и то, что реально
// разрешится, три разные вещи.
//
// ## Положительный контроль — половина гейта, а не украшение
//
// Без него зелёный прогон значил бы сразу две вещи: «разворачиватель вложенной форме не нужен» и
// «проверка до него не дошла». Поэтому в ТОЙ ЖЕ установке плоская форма обязана ПАДАТЬ, и падать
// именно на разворачивателе.

import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { flattenCss } from "../src/flatten.js";
import { PKG, installFromTarball, link, pkgRoot, runInInstall } from "./helpers/install.js";

/** Вложенный образец: тот же текст разворачивают обе стороны — установка и наш исходник. */
const NESTED = `@layer probe-web-skin {
  [data-scope="button"][data-part="root"] {
    color: #ffffff;
    &::before { content: ""; }
    @media (min-width: 40rem) { padding: 1rem; }
  }
}`;

let work: string;
let install: string;
let entries: string[];

beforeAll(() => {
  ({ work, install, entries } = installFromTarball("probe-web-skin-pack-"));

  // Кит и набор значений — ОБЯЗАТЕЛЬНЫЕ одноранговые: без них не работает ни один вход, и
  // «вложенная форма не платит» про них ничего не обещает. Разворачиватель НЕ кладём: он и есть
  // предмет проверки.
  link(install, "@omnifield/probe-web-ui");
  link(install, "@omnifield/probe-web-style");
}, 120_000);

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("что уезжает в тарбол", () => {
  it("везёт сборку всех трёх входов — код и типы", () => {
    expect(entries).toEqual(
      expect.arrayContaining([
        "dist/index.js",
        "dist/index.d.ts",
        "dist/model.js",
        "dist/model.d.ts",
        "dist/flat.js",
        "dist/flat.d.ts",
        "package.json",
        "README.md",
      ]),
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
});

describe("разворачиватель необязателен: вложенная форма не платит", () => {
  it("корневой вход поднимается там, где разворачивателя нет", () => {
    expect(runInInstall(install, `await import(${JSON.stringify(PKG)});`)).toBe("");
  });

  it("`./model` — тем более: он и печати не знает", () => {
    expect(runInInstall(install, `await import(${JSON.stringify(`${PKG}/model`)});`)).toBe("");
  });

  it("порождение в такой установке РАБОТАЕТ, а не только импортируется", () => {
    // Импорт мог бы пройти на ленивом графе модулей. Здесь скин действительно порождается —
    // значит вложенная форма доезжает до текста без разворачивателя.
    const printed = runInInstall(
      install,
      `import { withPassports } from ${JSON.stringify(PKG)};
       const { generateSkinCss } = withPassports(() => undefined);
       const css = generateSkinCss(
         { name: "проба", variables: { light: { a: "#fff" } }, recipes: {} },
       );
       console.log(css.includes("--a: #fff;"));`,
    );

    expect(printed).toBe("true");
  });

  it("а `./flat` в ТОЙ ЖЕ установке падает — положительный контроль", () => {
    // Без этой пробы зелёные три выше значили бы и «не нужен», и «до него не дошли».
    const refused = runInInstall(install, `await import(${JSON.stringify(`${PKG}/flat`)});`);

    expect(refused).toMatch(/^ОТКАЗ:/);
    expect(refused).toMatch(/Cannot find package 'postcss/);
  });

  it("объявлен НЕОБЯЗАТЕЛЬНЫМ одноранговым, а не выброшен", () => {
    // Поле — не послабление, а точное описание факта: разворачиватель нужен ровно одному входу
    // из трёх. Без него pnpm доставил бы его на диск и тому, кто взял только вложенную форму:
    // одноранговые он ставит сам (`auto-install-peers` по умолчанию).
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };

    expect(manifest.dependencies).toBeUndefined();
    for (const name of ["postcss", "postcss-nested"]) {
      expect(manifest.peerDependencies?.[name]).toBeDefined();
      expect(manifest.peerDependenciesMeta?.[name]?.optional).toBe(true);
    }
  });

  it("кит и набор значений остались ОБЯЗАТЕЛЬНЫМИ: без них не работает ничего", () => {
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };

    for (const name of ["@omnifield/probe-web-ui", "@omnifield/probe-web-style"]) {
      expect(manifest.peerDependenciesMeta?.[name]).toBeUndefined();
    }
  });
});

// Гейт ходит в детей и РАЗБИРАЕТ то, что они напечатали. Значит их вывод обязан быть данными, а
// не текстом для человека, — и обязан быть им при ЛЮБОМ способе запуска.
//
// Оплачено `PWEB-58`: под `FORCE_COLOR=1` ребёнок красил булево жёлтым, точное сравнение ловило
// `[33mtrue[39m`, и проба краснела без единого дефекта. Три способа запуска (`pnpm test` из
// корня, `pnpm test` в папке зоны, `npx nx`) давали разные условия одному и тому же коду.
//
// Пробы ниже держат это МАШИНОЙ, а не памятью: они сами включают окраску у родителя, поэтому
// отвечают одинаково независимо от того, как запустили их самих.
describe("вывод ребёнка — данные, а не текст для человека", () => {
  /** Прогоняет тело с окраской, включённой у РОДИТЕЛЯ, и возвращает окружение как было. */
  function underColour<T>(what: () => T): T {
    const was = process.env.FORCE_COLOR;
    process.env.FORCE_COLOR = "1";
    try {
      return what();
    } finally {
      if (was === undefined) delete process.env.FORCE_COLOR;
      else process.env.FORCE_COLOR = was;
    }
  }

  it("окраска у родителя не доезжает до ответа ребёнка", () => {
    // Предмет: печатается ровно то значение, которое красят, — булево.
    expect(underColour(() => runInInstall(install, "console.log(true);"))).toBe("true");
  });

  it("и это не совпадение: ребёнок ВИДИТ погашенную окраску", () => {
    // Механизм назван значением, а не выведен из отсутствия escape-последовательностей. Проверять
    // «Node сегодня красит булевы» было бы тем же ложным гейтом с другой стороны: перестанет
    // красить — покраснеем мы, а дефекта не будет.
    expect(underColour(() => runInInstall(install, "console.log(process.env.FORCE_COLOR);"))).toBe(
      "0",
    );
  });
});

describe("с объявленным разворачивателем плоская форма работает и даёт ПРЕЖНИЙ вывод", () => {
  beforeAll(() => {
    link(install, "postcss");
    link(install, "postcss-nested");
  });

  it("`./flat` поднимается", () => {
    expect(runInInstall(install, `await import(${JSON.stringify(`${PKG}/flat`)});`)).toBe("");
  });

  it("и разворачивает ровно так же, как исходник в репозитории", () => {
    // Сравнение с ТЕКУЩИМ выводом, а не с записанной строкой: записанная строка была бы вторым
    // экземпляром ответа и разъехалась бы с первым молча.
    const printed = runInInstall(
      install,
      `import { flattenCss } from ${JSON.stringify(`${PKG}/flat`)};
       process.stdout.write(flattenCss(${JSON.stringify(NESTED)}));`,
    );

    expect(printed).toBe(flattenCss(NESTED).trim());
  });
});
