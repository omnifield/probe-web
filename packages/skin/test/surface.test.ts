// ПОВЕРХНОСТЬ ПОСТАВКИ — обещание подпутей, проверенное по СОБРАННОМУ файлу, а не по намерению.
//
// Обещание одно и стоит денег потребителю: порождение отдаёт ВЛОЖЕННУЮ форму и postcss в цепочку
// не тянет — витрина и редактор порождают CSS на каждое движение ручки, и разворачиватель был
// там главным весом.
//
// Проверить это можно только тем, что уехало в `dist`: исходник об этом не говорит — важно, что
// попало в бандл после разрешения импортов.
//
// Проба идёт после сборки: `pnpm test` собирает пакет первым шагом.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { withPassports, type PassportLookup } from "../src/index.js";
import { lookup } from "./passports.js";
import { наряд, части } from "./looks.js";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Собранный файл поставки как текст. */
function bundle(name: string): string {
  return readFileSync(join(pkgRoot, "dist", name), "utf8");
}

/** Манифест пакета — здесь нужен ровно ради перечня подпутей. */
const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  exports: Record<string, { types: string; default: string }>;
};

/** Чужие пакеты, которые вход тянет за собой. Из СОБРАННОГО файла, а не из исходника. */
function imports(name: string): string[] {
  return [
    ...new Set(
      [...bundle(name).matchAll(/from\s*"([^".][^"]*)"/g)].map((match) => match[1]!),
    ),
  ].toSorted();
}

describe("что каждый вход тянет за собой", () => {
  // Проверяется РЕБРО, а не наличие подстроки: перечень целиком, а не «содержит». Подросший
  // молча импорт — это ровно то, чего проба обязана не пропустить, и обнаруживается он только
  // сравнением всего списка.

  it("корень: набор значений и анатомия, и ни следа кита или postcss", () => {
    // Кита в этом рёбре БОЛЬШЕ НЕТ (`PWEB-110`): форма паспорта переехала физически, и
    // порождённый бандл больше не тянет `@omnifield/probe-web-ui/passport` — цикл разорван
    // физически, не только по факту.
    //
    // `@zag-js/anatomy` — НОВОЕ ребро (`PWEB-112`): `createAnatomy` реэкспортирован, а не
    // переоткрыт вторым npm-именем на тот же поток. Ребро настоящее и обязано остаться ровно
    // этим одним пакетом — без своих зависимостей, вес нулевой.
    expect(imports("index.js")).toEqual(["@omnifield/probe-web-style", "@zag-js/anatomy"]);
  });

  it("`./model`: то же самое — построение семенами это МОДЕЛЬ, и Solid она не тянет", () => {
    // Набор значений приехал сюда за построением шкал (`PWEB-43`): семена — часть записи скина,
    // и от них зависит уже проверка имён, а не только порождение. Своего построения заводить
    // было нельзя — оно объявлено гейтом там.
    //
    // Имя ЗДЕСЬ БОЛЬШЕ НЕ ПИНИТСЯ на подпуть (`PWEB-57`). Пока корень зоны значений объявлял
    // Solid одноранговым, модель тянула реактивность транзитивно, и узкий вход `/values` был
    // единственным способом её не тянуть (`PWEB-44`). Реактивной части там не осталось, Solid
    // зоне не нужен вовсе, и второй двери к одному коду быть не должно.
    //
    // Обещание «модель без Solid» от смены двери не ослабло: держит его не имя входа, а
    // отдельная проба ниже — по СОБРАННОМУ файлу, а не по тому, как назван импорт.
    expect(imports("model.js")).toEqual(["@omnifield/probe-web-style", "@zag-js/anatomy"]);
  });

  it("`./flat`: только разворот, и ничего из зоны", () => {
    expect(imports("flat.js")).toEqual(["postcss", "postcss-nested"]);
  });

  it("`./editor`: ни одного чужого пакета — срез редактора не тянет даже анатомию (`PWEB-115`)", () => {
    // `PassportGenus`/`PassportAdmission`/`defineEditorInfo` не нуждаются в `@zag-js/anatomy`
    // напрямую: единственная связь со срезом рантайма — тип `ComponentPassport`, а тип стирается
    // на сборке. Пустой перечень здесь — не случайность, а свойство границы: подрасти он хоть
    // одним рёбром, значило бы, что срез редактора тянет за собой что-то, кроме своих данных.
    expect(imports("editor.js")).toEqual([]);
  });

  it("`./flat` отдаёт ТОЛЬКО разворот: широкий вход вернул бы postcss всем", async () => {
    const flat = await import("../src/flat.js");

    expect(Object.keys(flat)).toEqual(["flattenCss"]);
  });

  it("читаемость — в корне, а не в `./model`", async () => {
    const root = await import("../src/index.js");
    const model = await import("../src/model.js");

    expect(typeof root.skinContrast).toBe("function");
    expect("skinContrast" in model).toBe(false);
  });

  it("покрытие и значения — в `./model`: хранилищу они нужны, а конвейер CSS нет", async () => {
    const model = await import("../src/model.js");

    expect(typeof model.skinGaps).toBe("function");
    expect(typeof model.skinValues).toBe("function");
  });

  it("сборщик читателя едет ТЕМ ЖЕ входом, что и его тип (`PWEB-95`)", async () => {
    // Тип `PassportLookup` отдавал `./model`, а самой сборки не отдавал никто — и держатель
    // перечня обязан был написать свою карту, то есть завести вторую. Проба спрашивает оба входа:
    // тип проверяет компилятор (аннотация ниже), наличие сборки — прогон.
    const model = await import("../src/model.js");
    const root = await import("../src/index.js");

    const читатель: PassportLookup = model.passportLookup([]);

    expect(typeof читатель).toBe("function");
    expect(typeof root.passportLookup).toBe("function");
  });
});

describe("что уезжает, а что остаётся", () => {
  it("все четыре подпути объявлены и указывают на собранные файлы", () => {
    expect(Object.keys(manifest.exports)).toEqual([".", "./model", "./flat", "./editor"]);
    for (const name of ["index", "model", "flat", "editor"]) {
      expect(() => bundle(`${name}.js`)).not.toThrow();
      expect(() => bundle(`${name}.d.ts`)).not.toThrow();
    }
  });

  // Что объявлено в манифесте — предмет гейта ПОСТАВКИ (`test/pack.test.ts`): там это
  // проверяется установкой, а не чтением полей. Здесь — только рёбра собранных файлов: два
  // места, утверждающих одно, разъехались бы, и правым оказался бы тот, кого спросили последним.

  it("ни Solid, ни отрисовки в поставке нет: механика превращает данные в текст", () => {
    for (const name of ["index.js", "model.js"]) {
      expect(bundle(name)).not.toContain("solid-js");
    }
  });
});

// СРЕЗ РЕДАКТОРА ОТДЕЛЁН ГРАНИЦЕЙ МОДУЛЕЙ, А НЕ ОБЕЩАНИЕМ (`PWEB-115`).
//
// Найдено на настоящей сборке `apps/reference`: `means` и текст сборки доезжали до браузера
// целиком, хотя приложение их не читает. Здесь — тот же приём («настоящий бандл, грепнуть
// строку»), только на уровне ЭТОЙ поставки: `index.ts`/`model.ts` физически не импортируют
// `passport-editor.ts`/`passport-assembly.ts`, и esbuild кладёт в бандл только достижимое из
// entry point — до всякой сборки потребителя.
//
// Отрицательный контроль без положительного значил бы либо «не попадает», либо «строка мимо
// имени» — вторая проба ниже доказывает, что имя действительно оказалось бы в тексте, будь оно
// достижимо: `defineEditorInfo` и `GROUPS` — настоящие идентификаторы `passport-editor.ts`, не
// выдуманные ради пробы.
describe("срез редактора отделён физически (`PWEB-115`)", () => {
  const EDITOR_ONLY = ["defineEditorInfo", "baseAssemblyOf", "admits", "GROUPS"];

  it("рантайм-входы не содержат НИ СТРОКИ редакторского кода", () => {
    for (const name of ["index.js", "model.js"]) {
      for (const needle of EDITOR_ONLY) {
        expect(bundle(name)).not.toContain(needle);
      }
    }
  });

  it("положительный контроль: те же строки НАСТОЯЩИЕ — `./editor` их несёт", () => {
    // Без этой пробы прошлая осталась бы неотличима от «искали не там»: три из четырёх
    // идентификаторов — типы и функции, а `GROUPS` могло бы случайно не встретиться в минифайле.
    // Здесь на том же СОБРАННОМ файле доказывается обратное.
    for (const needle of ["defineEditorInfo", "GROUPS"]) {
      expect(bundle("editor.js")).toContain(needle);
    }
  });
});

describe("второго генератора нет", () => {
  it("связка знает одно порождение скина и одно — правок образца", async () => {
    const { withPassports } = await import("../src/index.js");
    const generators = Object.keys(withPassports(() => undefined)).filter((name) =>
      name.startsWith("generate"),
    );

    expect(generators.toSorted()).toEqual(["generateSketchCss", "generateSkinCss"]);
  });

  it("отдельного «порождения для предпросмотра» на поверхности не появилось", async () => {
    const surface = await import("../src/index.js");

    expect(Object.keys(surface).some((name) => /preview|предпросмотр/i.test(name))).toBe(false);
  });
});

describe("источник паспортов называется ОДИН раз (`PWEB-94`)", () => {
  // Гейт задачи. Пока источник был доводом каждого вызова, подпись разрешала проверить наряд
  // одним источником, а породить другим: совсем чужой падал громко, а два одинаково полных ПО
  // ИМЕНАМ, но разных по анатомии, расходились молча — правило целилось в атрибуты, которых на
  // узле нет. Держит это теперь ПОДПИСЬ, и проверяется это здесь.

  it("свободного порождения на поверхности не осталось — ни в корне, ни в `./model`", async () => {
    const root = await import("../src/index.js");
    const model = await import("../src/model.js");

    for (const surface of [root, model]) {
      for (const name of [
        "generateSkinCss",
        "generateSketchCss",
        "assemble",
        "checkOutfit",
        "checkSkin",
        "checkSketch",
        "skinRules",
        "sketchRules",
      ]) {
        expect(name in surface, name).toBe(false);
      }
    }
  });

  it("связка одна на оба входа, и корневая — НАДМНОЖЕСТВО модельной", async () => {
    // Тот же шов, что и у всего остального в этом пакете: делит входы то, что попадёт в сборку
    // потребителя. Хранилищу печатать нечего, поэтому в `./model` её и нет.
    const root = await import("../src/index.js");
    const model = await import("../src/model.js");

    const корневая = Object.keys(root.withPassports(() => undefined)).toSorted();
    const модельная = Object.keys(model.withPassports(() => undefined)).toSorted();

    expect(модельная).toEqual([
      "assemble",
      "checkOutfit",
      "checkSketch",
      "checkSkin",
      "sketchRules",
      "skinRules",
    ]);
    expect(корневая).toEqual([...модельная, "generateSkinCss", "generateSketchCss"].toSorted());
  });

  it("МУТАЦИЯ: породить одним источником, а проверить другим — не собирается", () => {
    // Держит эту пробу КОМПИЛЯТОР, а не прогон: тело ниже не исполняется — исполнять в нём нечего.
    // Верни кто-нибудь свободную подпись рядом со связкой — `@ts-expect-error` останется без
    // ошибки, и покраснеет `pnpm lint`, назвав причину. Прогоном такое не ловится вовсе.
    function мутация(): void {
      const { assemble, generateSkinCss } = withPassports(lookup);
      const { skin } = assemble(наряд, части);

      // @ts-expect-error источник называется один раз — связкой, а не доводом вызова
      generateSkinCss(skin, lookup);
      // @ts-expect-error то же и у сборки: доводов у неё два — наряд и части
      assemble(наряд, части, lookup);
    }

    expect(typeof мутация).toBe("function");
  });
});
