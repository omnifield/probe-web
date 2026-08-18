// ПОВЕРХНОСТЬ ПАКЕТА: то, что зона отдаёт наружу через `exports`.
//
// Предмет отдельный от всего остального в `test/`. Там проверяется, что компоненты работают;
// здесь — что до них вообще можно ДОТЯНУТЬСЯ снаружи. Пока `exports` не было, зона работала
// прекрасно и была недостижима: потребитель не мог показать её у себя, а значит не мог
// проверить оформление на живой странице (заявка owner-skin 2026-08-17).
//
// Проверка нужна именно машинная. Опечатка в подпути, переехавший файл, забытый при
// добавлении модуль — всё это не ломает ни сборку зоны, ни её пробы: поверхность пакета не
// участвует в её собственной жизни. Ломается это только у потребителя, и молча.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  name: string;
  exports?: Record<string, string>;
};

const exports = manifest.exports ?? {};
const subpaths = Object.keys(exports);

/** Модули поставки — те, у кого есть объявленная граница `index.ts`. */
const DELIVERED = ["table", "filters", "chart", "adapter", "dataset"];

describe("пакет вообще что-то отдаёт", () => {
  it("`exports` объявлен и не пуст", () => {
    // До этой правки поле было пустым, и зона была невидима снаружи целиком.
    expect(subpaths.length).toBeGreaterThan(0);
  });

  it("каждый подпуть указывает на существующий файл", () => {
    for (const [subpath, target] of Object.entries(exports)) {
      expect(existsSync(resolve(root, target)), `${subpath} → ${target}`).toBe(true);
    }
  });

  it("ничего не отдаётся из `test/` и вообще из-за пределов `src/`", () => {
    // Тестовый файл в поверхности — это обещание, которого нет: `test/` не едет потребителю,
    // и с переездом зоны путь исчезнет. Ровно эта ошибка и была с реестром зацепок.
    for (const [subpath, target] of Object.entries(exports)) {
      expect(target.startsWith("./src/"), `${subpath} → ${target}`).toBe(true);
    }
  });
});

describe("подпути ложатся на объявленные границы модулей", () => {
  for (const module of DELIVERED) {
    it(module, () => {
      // Имя подпути — то же, что имя папки: другого адреса у модуля нет, и придумывать ему
      // второй значит заводить два имени одному предмету.
      const subpath = `./${module === "filters" ? "filters" : module}`;
      expect(subpaths, `модуль ${module} не отдаётся наружу`).toContain(subpath);
      expect(exports[subpath]).toBe(`./src/${module}/index.ts`);
    });
  }

  it("новый модуль с границей не остаётся молча невидимым", () => {
    // Обратная сторона: завели `src/<модуль>/index.ts` — обязаны либо отдать его, либо
    // осознанно не отдавать. Молчаливая невидимость — то, с чего начался этот заход.
    const withBoundary = readdirSync(join(root, "src"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(root, "src", entry.name, "index.ts")))
      .map((entry) => entry.name);

    // `playground` — стенд, он не поставляется и границы не объявляет.
    expect([...withBoundary].sort()).toEqual([...DELIVERED].sort());
  });
});

/**
 * Загрузка каждой границы — ЛИТЕРАЛЬНЫМИ спецификаторами.
 *
 * Собрать путь из переменной нельзя: сборщик разбирает `import()` статически и на
 * `../src/${модуль}/index.js` отвечает «Unknown variable dynamic import». Значит перечень
 * пишется руками — и это не потеря, а та же логика, что у реестра зацепок: список, снятый с
 * папок, подтверждал бы сам себя, а забытый модуль ловит проба выше, сверяющая границы с
 * содержимым `src/`.
 */
const BOUNDARIES: Record<string, () => Promise<Record<string, unknown>>> = {
  table: () => import("../src/table/index.js"),
  filters: () => import("../src/filters/index.js"),
  chart: () => import("../src/chart/index.js"),
  adapter: () => import("../src/adapter/index.js"),
  dataset: () => import("../src/dataset/index.js"),
};

describe("объявленное действительно грузится", () => {
  // Существование файла не значит, что его можно импортировать: круговой импорт, сломанный
  // реэкспорт, опечатка в спецификаторе. Тянем по-настоящему.
  it("перечень границ покрывает все поставляемые модули", () => {
    expect(Object.keys(BOUNDARIES).sort()).toEqual([...DELIVERED].sort());
  });

  for (const [module, load] of Object.entries(BOUNDARIES)) {
    it(`./${module}`, async () => {
      const loaded = await load();
      expect(Object.keys(loaded).length, `${module} отдаёт пустую поверхность`).toBeGreaterThan(0);
    });
  }

  it("модули с разметкой отдают КОМПОНЕНТЫ, а не только типы", async () => {
    // Ради этого пункт и заводился: потребителю нужны компоненты, чтобы показать зону у себя.
    // Проверка по составу, а не по факту загрузки: модуль, из которого вынули компонент,
    // грузится прекрасно.
    const wanted: Record<string, string[]> = {
      table: ["DataTable", "HiddenColumns", "TablePager", "GroupControls"],
      filters: ["FilterBuilder"],
      chart: ["Chart", "ChartLegend"],
      adapter: ["AdapterBuilder"],
    };

    for (const [module, names] of Object.entries(wanted)) {
      const loaded = await BOUNDARIES[module]!();
      for (const name of names) {
        expect(typeof loaded[name], `${module} → ${name}`).toBe("function");
      }
    }
  });
});

describe("обещание зацепок отдаётся ДАННЫМИ", () => {
  it("`./slots.json` объявлен и разбирается сам по себе", () => {
    // Потребитель читает файлом, без сборки и без нашего TypeScript. Значит и проверяем так.
    const target = exports["./slots.json"];
    expect(target, "обещание не отдаётся наружу").toBe("./src/slots.json");

    const data = JSON.parse(readFileSync(resolve(root, target!), "utf8")) as Record<string, unknown>;
    expect(Object.keys(data).sort()).toEqual([
      "families",
      "foreign",
      "kitBacked",
      "separator",
      "states",
      "version",
    ]);
  });

  it("подпуть ведёт ровно в тот файл, который стережёт гейт", () => {
    // Иначе завелись бы два перечня: один обещанный, другой проверяемый.
    const promised = resolve(root, exports["./slots.json"]!);
    const guarded = resolve(here, "..", "src", "slots.json");
    expect(promised).toBe(guarded);
  });
});
