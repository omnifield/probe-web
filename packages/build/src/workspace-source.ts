// Соседи по воркспейсу видны ЧЕРЕЗ ИСХОДНИКИ, а не через вчерашнюю сборку. ВНУТРЕННЕЕ:
// наружу не экспортируется — поверхность зоны держим на трёх подпутях (`PROBEWEB-4`).
//
// Предмет. Пакеты репозитория связаны `workspace:*` (симлинк), но их `exports` ведут в `dist`.
// Значит дев-сервер отдаёт приложению собранное: правишь исходник соседа — в браузере вчерашний
// код, и вывод о своей правке делаешь по чужому старому. Лечится подменой цели на исходник.
//
// Почему АЛИАСОМ, а не условием `development` в `exports` пакетов. Оба способа рыночные (vite
// docs `resolve.conditions`; vitejs/vite discussions #17417, #6684 — сверено 2026-08-19), но
// условие в `exports` — это изменение ПУБЛИКУЕМОЙ поверхности: цель `./src/...` обязывает
// класть исходники в тарбол и отвечать за них перед потребителем. Такое решение принимается
// отдельно (`PWEB-8`) и не едет внутрь починки дев-цикла. Алиас же целиком внутри оснастки.
//
// Почему СЧИТАЕТСЯ, а не перечисляется списком имён. Пресет едет и в чужие продукты, где
// набор соседей другой, а список имён молча отстаёт от дерева. Признак воркспейс-соседа
// машинный: символическая ссылка из `node_modules` ведёт НАРУЖУ из `node_modules`. У пакета из
// реестра (в том числе у нашего же кита, поставленного потребителю) реальный путь остаётся
// внутри `node_modules`, алиасов не возникает вовсе, и поставка ведёт себя как прежде.
//
// Второе, что здесь считывается, — какие CSS-подпути соседа не файлы, а ПОРОЖДЕНИЕ (`PWEB-21`).
// Алиасом это не лечится: у порождённого файла исходника-пары нет вовсе, вместо подмены нужен
// вызов. Признак ровно такой же машинный — свойство пакета, объявленное на его поверхности, а
// не имя в нашем списке.

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { trace } from "./trace.js";

/** Расширения, в которых ищется исходник собранной цели. Порядок — приоритет поиска. */
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".jsx", ".js", ".mjs"];

/** Цель `exports`, за которой стоит модуль (а не тип, стиль или данные). */
const MODULE_TARGET = /\.[mc]?[jt]sx?$/;

/** Префикс собранной цели: подменяем только то, что пакет отдаёт из `dist`. */
const BUILT_PREFIX = "./dist/";

/** Цель `exports`, за которой стоит таблица стилей. */
const STYLE_TARGET = /\.css$/;

/**
 * Подпуть, которым пакет объявляет способность порождать свой CSS.
 *
 * Это ПРИЗНАК ПАКЕТА, а не список имён: способность объявлена на поверхности соседа, и
 * дев-сервер её считывает. Перечислять здесь `-style` и его собратьев значило бы завести
 * список, который молча отстанет на третьем пакете, — ровно та ошибка, от которой уходит
 * поиск соседей выше.
 */
const GENERATOR_SUBPATH = "./generate";

/** Найденные соседи по воркспейсу — то, из чего собирается дев-часть конфига. */
export interface WorkspaceSources {
  /** Имена пакетов-соседей: их дев-сервер не должен пребандлить как чужие зависимости. */
  names: string[];
  /** Корни их папок (реальные пути) — для `server.fs.allow`. */
  roots: string[];
  /** Точечные алиасы «подпуть пакета → файл исходника». */
  aliases: { find: RegExp; replacement: string }[];
  /** CSS-подпути соседей, которые порождаются функцией, а не лежат файлом. */
  generated: GeneratedCss[];
}

/**
 * CSS-подпуть соседа, за которым стоит не файл прошлой сборки, а функция его пакета.
 *
 * Договор с соседом целиком читается из его `exports` и держится на двух условиях: пакет
 * объявил подпуть `./generate`, и в модуле за этим подпутём есть функция, названная по
 * CSS-подпутю (`./base.css` → `baseCss`). Не выполнено второе — подпуть остаётся файлом на
 * диске, то есть прежним поведением.
 */
export interface GeneratedCss {
  /** Спецификатор, которым его импортирует приложение (`…-style/base.css`). */
  specifier: string;
  /** Цель `exports` абсолютным путём: тот же адрес модуля, что и в сборке. */
  id: string;
  /** Исходник модуля-порождателя — подпуть `./generate` соседа. */
  generator: string;
  /** Имя функции в нём. */
  exportName: string;
  /** Корень пакета: по нему опознаётся правка, от которой порождённое устарело. */
  root: string;
}

/**
 * Читает JSON, отдаёт `undefined` на любой осечке.
 *
 * Молчание намеренное: отсутствующий или битый манифест соседа — не повод валить сборку
 * приложения. Худшее, что случится, — пакет останется на `dist`, то есть на прежнем поведении.
 *
 * @param file путь к файлу
 * @returns разобранное содержимое или `undefined`
 */
function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Собирает все строковые цели поддерева `exports` — по всем условиям сразу.
 *
 * Условия обходятся целиком, потому что за разными ветками одного подпутя стоит один и тот же
 * исходник: у кита `solid` ведёт в `dist/index.jsx`, `default` — в `dist/index.js`, а исходник
 * у обоих `src/index.tsx`. Достаточно первой цели, из которой исходник нашёлся.
 *
 * @param node узел `exports` (строка, массив или карта условий)
 * @param out накопитель целей
 */
function collectTargets(node: unknown, out: string[]): void {
  if (typeof node === "string") {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectTargets(item, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const value of Object.values(node)) collectTargets(value, out);
  }
}

/**
 * Раскладывает `exports` на пары «подпуть → цели».
 *
 * @param exports поле `exports` манифеста пакета
 * @returns карта подпутей (`.`, `./passport`, …) в перечень целей
 */
function subpathTargets(exports: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (exports === undefined || exports === null) return map;

  const isSubpathMap =
    typeof exports === "object" &&
    !Array.isArray(exports) &&
    Object.keys(exports).some((key) => key.startsWith("."));

  if (!isSubpathMap) {
    const targets: string[] = [];
    collectTargets(exports, targets);
    map.set(".", targets);
    return map;
  }

  for (const [subpath, node] of Object.entries(exports as Record<string, unknown>)) {
    // Шаблоны (`./*`) пропускаем: подмена по образцу требует знать раскладку чужой папки, а
    // ошибиться здесь значит молча отдать приложению не тот файл.
    if (!subpath.startsWith(".") || subpath.includes("*")) continue;

    const targets: string[] = [];
    collectTargets(node, targets);
    map.set(subpath, targets);
  }
  return map;
}

/**
 * Ищет исходник, из которого собрана цель `exports`.
 *
 * Подменяются ТОЛЬКО модульные цели из `dist`. У стилей и данных исходника-пары нет вовсе:
 * собранный `css` пакета бывает не копией файла, а результатом порождения (так устроен
 * `style`). Подставить туда «исходник» нечего, и попытка отдала бы приложению другое
 * содержимое — молча и без единой ошибки. Свежесть таких целей закрывается не алиасом, а
 * порождением в момент запроса: см. `GeneratedCss` ниже и зацеп в `vite.ts`.
 *
 * @param packageDir корень пакета-соседа
 * @param target цель из его `exports`
 * @returns абсолютный путь исходника или `undefined`
 */
function sourceForTarget(packageDir: string, target: string): string | undefined {
  if (!target.startsWith(BUILT_PREFIX)) return undefined;
  if (target.endsWith(".d.ts")) return undefined;
  if (!MODULE_TARGET.test(target)) return undefined;

  const rest = target.slice(BUILT_PREFIX.length);
  const withoutExtension = rest.replace(/\.[^./]+$/, "");

  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = join(packageDir, "src", withoutExtension + extension);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Экранирует спецификатор для точного `RegExp`.
 *
 * Точное совпадение обязательно: строковый алиас в Vite срабатывает по НАЧАЛУ спецификатора, и
 * алиас на имя пакета перехватил бы его подпути — импорт `…-style/base.css` уехал бы в
 * `src/index.ts`.
 *
 * @param value спецификатор импорта
 * @returns тот же текст, безопасный внутри регулярного выражения
 */
function exactPattern(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

/**
 * Имя функции-порождателя по CSS-подпутю: `./base.css` → `baseCss`, `./themes.css` → `themesCss`.
 *
 * Имя ВЫВОДИТСЯ, а не берётся из отдельного поля манифеста. Поле пришлось бы согласовывать и
 * держать вдвоём — то есть завести второй источник правды о том, что уже сказано подпутём.
 *
 * @param subpath подпуть `exports` вида `./base.css`
 * @returns ожидаемое имя экспорта в модуле `./generate`
 */
function generatorExportName(subpath: string): string {
  const file = subpath.slice(subpath.lastIndexOf("/") + 1);
  const stem = file.replace(STYLE_TARGET, "");
  return `${stem.replace(/[-_.](\w)/g, (_, letter: string) => letter.toUpperCase())}Css`;
}

/**
 * Считывает с поверхности соседа его CSS-подпути, которые он умеет порождать сам.
 *
 * Проверяется ровно то, что видно в манифесте: есть подпуть `./generate` с найденным
 * исходником — значит у пакета есть порождатель, и каждый его CSS-подпуть попадает сюда.
 * Есть ли внутри нужная функция, выяснится при загрузке: манифест об этом не знает, а
 * загружать чужой модуль ради разбора конфига неоправданно дорого.
 *
 * @param name имя пакета-соседа
 * @param packageDir корень его папки
 * @param targetsBySubpath разложенные `exports` соседа
 * @param out накопитель
 */
function collectGeneratedCss(
  name: string,
  packageDir: string,
  targetsBySubpath: Map<string, string[]>,
  out: GeneratedCss[],
): void {
  const generator = (targetsBySubpath.get(GENERATOR_SUBPATH) ?? [])
    .map((target) => sourceForTarget(packageDir, target))
    .find((found) => found !== undefined);
  if (!generator) return;

  for (const [subpath, targets] of targetsBySubpath) {
    if (subpath === ".") continue;

    const target = targets.find((candidate) => STYLE_TARGET.test(candidate));
    if (!target) continue;

    out.push({
      specifier: `${name}/${subpath.slice(2)}`,
      id: join(packageDir, target),
      generator,
      exportName: generatorExportName(subpath),
      root: packageDir,
    });
  }
}

/**
 * Находит соседей по воркспейсу среди зависимостей проекта и строит для них дев-часть конфига.
 *
 * @param projectRoot корень приложения-потребителя (там, где лежит его `package.json`)
 * @returns имена соседей, корни их папок и точечные алиасы на исходники
 */
export function findWorkspaceSources(projectRoot: string): WorkspaceSources {
  const done = trace("findWorkspaceSources");
  const result: WorkspaceSources = { names: [], roots: [], aliases: [], generated: [] };

  const manifest = readJson(join(projectRoot, "package.json"));
  if (!manifest || typeof manifest !== "object") {
    done();
    return result;
  }

  const fields = manifest as Record<string, unknown>;
  const dependencyNames = new Set<string>();
  for (const field of ["dependencies", "devDependencies"] as const) {
    const block = fields[field];
    if (block && typeof block === "object") {
      for (const name of Object.keys(block)) dependencyNames.add(name);
    }
  }

  for (const name of dependencyNames) {
    const linked = join(projectRoot, "node_modules", name);
    if (!existsSync(linked)) continue;

    let packageDir: string;
    try {
      packageDir = realpathSync(linked);
    } catch {
      continue;
    }

    // Признак соседа по воркспейсу: реальный путь вывел ИЗ `node_modules`. Пакет из реестра
    // остаётся внутри (`node_modules/.pnpm/…`) и сюда не попадает.
    if (packageDir.split(/[\\/]/).includes("node_modules")) continue;

    const neighbour = readJson(join(packageDir, "package.json"));
    if (!neighbour || typeof neighbour !== "object") continue;

    result.names.push(name);
    result.roots.push(packageDir);

    const targetsBySubpath = subpathTargets((neighbour as Record<string, unknown>).exports);

    for (const [subpath, targets] of targetsBySubpath) {
      const source = targets
        .map((target) => sourceForTarget(packageDir, target))
        .find((found) => found !== undefined);
      if (!source) continue;

      const specifier = subpath === "." ? name : `${name}/${subpath.slice(2)}`;
      result.aliases.push({ find: exactPattern(specifier), replacement: source });
    }

    collectGeneratedCss(name, packageDir, targetsBySubpath, result.generated);
  }

  result.names.sort();
  result.roots.sort();
  done();
  return result;
}
