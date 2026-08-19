// Соседи по воркспейсу видны ЧЕРЕЗ ИСХОДНИКИ, а не через вчерашнюю сборку. ВНУТРЕННЕЕ:
// наружу не экспортируется — поверхность зоны держим на трёх подпутях (`kb:PROBEWEB-4`).
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

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { trace } from "./trace.js";

/** Расширения, в которых ищется исходник собранной цели. Порядок — приоритет поиска. */
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts", ".jsx", ".js", ".mjs"];

/** Цель `exports`, за которой стоит модуль (а не тип, стиль или данные). */
const MODULE_TARGET = /\.[mc]?[jt]sx?$/;

/** Префикс собранной цели: подменяем только то, что пакет отдаёт из `dist`. */
const BUILT_PREFIX = "./dist/";

/** Найденные соседи по воркспейсу — то, из чего собирается дев-часть конфига. */
export interface WorkspaceSources {
  /** Имена пакетов-соседей: их дев-сервер не должен пребандлить как чужие зависимости. */
  names: string[];
  /** Корни их папок (реальные пути) — для `server.fs.allow`. */
  roots: string[];
  /** Точечные алиасы «подпуть пакета → файл исходника». */
  aliases: { find: RegExp; replacement: string }[];
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
 * Подменяются ТОЛЬКО модульные цели из `dist`. Стили и данные оставлены на собранном
 * намеренно: собранный `css` пакета может быть не копией исходника, а результатом генерации
 * (так устроен `style`: `themes.css` рождается из собранных модулей). Подмена такого файла
 * исходником отдала бы приложению другое содержимое — молча и без единой ошибки, а это ровно
 * то, от чего задача избавляется.
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
 * Находит соседей по воркспейсу среди зависимостей проекта и строит для них дев-часть конфига.
 *
 * @param projectRoot корень приложения-потребителя (там, где лежит его `package.json`)
 * @returns имена соседей, корни их папок и точечные алиасы на исходники
 */
export function findWorkspaceSources(projectRoot: string): WorkspaceSources {
  const done = trace("findWorkspaceSources");
  const result: WorkspaceSources = { names: [], roots: [], aliases: [] };

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

    for (const [subpath, targets] of subpathTargets(
      (neighbour as Record<string, unknown>).exports,
    )) {
      const source = targets
        .map((target) => sourceForTarget(packageDir, target))
        .find((found) => found !== undefined);
      if (!source) continue;

      const specifier = subpath === "." ? name : `${name}/${subpath.slice(2)}`;
      result.aliases.push({ find: exactPattern(specifier), replacement: source });
    }
  }

  result.names.sort();
  result.roots.sort();
  done();
  return result;
}
