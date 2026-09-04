// Соседи по воркспейсу видны через исходники, а не через вчерашнюю сборку. ВНУТРЕННЕЕ —
// не в exports манифеста. Разбор — README.md/FAQ.md рядом (src/vite/).

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";

import { trace } from "../shared/trace.js";

/** Только TypeScript — см. README.md «Дев-цикл». Не находится — подпуть остаётся на dist. */
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".mts"];

/** Цель `exports`, за которой стоит модуль (а не тип, стиль или данные). */
const MODULE_TARGET = /\.[mc]?[jt]sx?$/;

/** Префикс собранной цели: подменяем только то, что пакет отдаёт из `dist`. */
const BUILT_PREFIX = "./dist/";

/** Цель `exports`, за которой стоит таблица стилей. */
const STYLE_TARGET = /\.css$/;

/** Подпуть, которым пакет объявляет способность порождать свой CSS (признак пакета, не список имён). */
const GENERATOR_SUBPATH = "./generate";

/** Найденные соседи по воркспейсу — то, из чего собирается дев-часть конфига. */
export interface WorkspaceSources {
  names: string[];
  roots: string[];
  aliases: { find: RegExp; replacement: string }[];
  generated: GeneratedCss[];
}

/** CSS-подпуть соседа, за которым стоит функция его пакета, а не файл прошлой сборки. */
export interface GeneratedCss {
  specifier: string;
  id: string;
  generator: string;
  exportName: string;
  root: string;
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8")) as unknown;
  } catch {
    // Битый/отсутствующий манифест соседа не валит сборку приложения — пакет просто останется на dist.
    return undefined;
  }
}

/** Собирает все строковые цели поддерева `exports` по всем условиям — исходник один на все ветки подпутя. */
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
    // Шаблоны (`./*`) пропускаем: подмена по образцу требует знать раскладку чужой папки.
    if (!subpath.startsWith(".") || subpath.includes("*")) continue;

    const targets: string[] = [];
    collectTargets(node, targets);
    map.set(subpath, targets);
  }
  return map;
}

/** Ищет исходник цели `exports`. Только модульные цели из `dist` — стили/данные см. README.md. */
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

/** Точное совпадение — строковый алиас Vite срабатывает по НАЧАЛУ спецификатора. */
function exactPattern(value: string): RegExp {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`);
}

/** Имя функции-порождателя по CSS-подпутю: `./base.css` → `baseCss`. Выводится, не берётся из манифеста. */
function generatorExportName(subpath: string): string {
  const file = subpath.slice(subpath.lastIndexOf("/") + 1);
  const stem = file.replace(STYLE_TARGET, "");
  return `${stem.replace(/[-_.](\w)/g, (_, letter: string) => letter.toUpperCase())}Css`;
}

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

/** Находит соседей по воркспейсу среди зависимостей проекта и строит для них дев-часть конфига. */
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

    // Соседи по воркспейсу выводят из node_modules символической ссылкой; пакет из реестра
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
