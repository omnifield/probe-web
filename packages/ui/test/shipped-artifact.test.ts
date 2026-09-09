// ГЕЙТ ПОСТАВКИ (заявка витрины 2026-09-09) — собранный кит не должен нести макросов сборщика.
//
// Прод-сборка `apps/skin` теряла ВСЕ иконки, а дев-сервер и `vitest` были зелёными. Причина —
// `import.meta.glob` в `src/icon/components/root.tsx`: это макрос Vite, раскрывающийся при
// трансформации ТОГО ЖЕ файла, а ветка `solid` поставки (`dist/index.jsx`) сборкой кита не
// трансформируется — макрос уезжал потребителю буквальным и раскрывался его Vite относительно
// `dist/`, где `../../../node_modules` — корень монорепозитория, куда pnpm пакет не поднимает.
// Ноль совпадений, пустая карта, ни ошибки, ни предупреждения.
//
// Ни дев, ни `vitest` этого увидеть не могли: оба читают `src`, где путь верен. Единственное
// место, где ложь видна, — сам артефакт поставки, поэтому проба читает `dist`, а не исходник.
// Тем же приёмом зона уже роняла витрину однажды (`PWEB-126`, см. шапку `space-roles.test.ts`);
// два раза — это не совпадение, а отсутствие гейта.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { catalog } from "../src/icon/entity/catalog.js";

const PACKAGE_DIR = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(PACKAGE_DIR, "src");
const DIST_DIR = join(PACKAGE_DIR, "dist");

// Ищем ВЫЗОВ, а не упоминание: разбор этой самой беды написан в шапках `root.tsx` и `catalog.ts`,
// и гейт, падающий на собственной документации, зона бы просто выключила.
const GLOB_MACRO = "import.meta.glob(";

/** Путь внутрь чужой раскладки зависимостей — у pnpm, npm и реестра она РАЗНАЯ. */
const DEPENDENCY_LAYOUT_PATH = "node_modules/";

function filesUnder(dir: string, match: RegExp): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(path, match));
    else if (match.test(entry.name)) found.push(path);
  }
  return found;
}

function guilty(files: readonly string[], needle: string): string[] {
  return files
    .filter((file) => readFileSync(file, "utf8").includes(needle))
    .map((file) => file.slice(PACKAGE_DIR.length));
}

describe("исходники кита не зовут макросов сборщика", () => {
  const sources = filesUnder(SRC_DIR, /\.[mc]?[jt]sx?$/);

  it("файлы для проверки нашлись", () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it(`нигде в src/ нет \`${GLOB_MACRO}\``, () => {
    expect(guilty(sources, GLOB_MACRO)).toEqual([]);
  });
});

describe("собранный dist не несёт ни макроса, ни чужой раскладки", () => {
  // Гоняется ПОСЛЕ сборки: `nx` держит `test.dependsOn: ["build"]` (`package.json`). Голый
  // `vitest run` на несобранном дереве честно падает здесь, а не молча пропускает гейт.
  const built = existsSync(DIST_DIR) ? filesUnder(DIST_DIR, /\.[mc]?jsx?$/) : [];

  it("dist/ собран — иначе проверять нечего", () => {
    expect(built.length).toBeGreaterThan(0);
  });

  it.each([GLOB_MACRO, DEPENDENCY_LAYOUT_PATH])("нигде в dist/ нет `%s`", (needle) => {
    expect(guilty(built, needle)).toEqual([]);
  });
});

describe("словарь иконок — каждое имя разрешимо снаружи кита", () => {
  const names = Object.keys(catalog);

  // Резолв ведёт САМ node по exports-карте `lucide-solid`. Опечатка в словаре или иконка,
  // переименованная апстримом (так уже было с `trash-2` → `trash`), падает здесь, а не в проде.
  it("каждое имя резолвится exports-картой lucide-solid", () => {
    const require = createRequire(join(PACKAGE_DIR, "package.json"));
    const broken = names.filter((name) => {
      try {
        require.resolve(`lucide-solid/icons/${name}`);
        return false;
      } catch {
        return true;
      }
    });
    expect(broken).toEqual([]);
  });
});
