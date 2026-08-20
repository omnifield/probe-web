// Пресет линта — ОСНАСТКА, и собирается он на установке: у пакета есть жизненный цикл
// `prepare`, и менеджер зовёт его для пакетов рабочего пространства при `pnpm install`. Отсюда
// свойство, ради которого всё и делается: на свежем клоне линт проходит без отдельной команды
// сборки — хотя `eslint.config.js` потребителя импортирует собранный пресет.
//
// Почему это нельзя закрыть подменой пути на исходники: конфиг линта грузит Node напрямую, Vite
// в этой цепочке нет вовсе — подменять путь некому. Инструмент, которым проверяют, не может
// проверяться собой во время собственной загрузки; то же и у оснастки сборки, форма пробы
// оттуда и взята.
//
// Проба утверждает НАШУ часть — что скрипт объявлен и что он действительно строит пакет с нуля.
// «Менеджер зовёт `prepare` на установке» — свойство менеджера, а не наше: проверять его здесь
// значило бы тестировать pnpm.

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  exports: Record<string, string | Record<string, string>>;
  scripts?: Record<string, string>;
};

/** Что копируется в чистую копию зоны: всё, из чего собирается пакет, и ни файла сборки. */
const SOURCES = ["package.json", "tsconfig.json", "tsconfig.build.json", "src"];

/** Служебное в `node_modules`, что копии не нужно: своё дерево пакетов и отчёты менеджера. */
const MANAGER_INTERNALS = new Set([".pnpm", ".modules.yaml", ".package-map.json", ".vite"]);

let workDir = "";
/** Копия зоны БЕЗ `dist` — состояние свежего клона, где сборку ещё не запускали. */
let copy = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "probe-web-lint-prepare-"));
  copy = join(workDir, "package");

  for (const entry of SOURCES) {
    cpSync(join(pkgRoot, entry), join(copy, entry), { recursive: true });
  }

  // Зависимости не ставим заново — берём поставленные в зоне: предмет пробы это сборка, а не
  // скорость менеджера. Но `node_modules` копии — РЕАЛЬНАЯ папка со ссылками внутрь, а не одна
  // ссылка на папку зоны. Разница дорогая и замерена зоной `build` 2026-08-19: копия без
  // lockfile'а заставляет pnpm перед запуском скрипта позвать `pnpm install`, и по ссылке-папке
  // он переписал `node_modules` САМОЙ ЗОНЫ на дерево во временном каталоге — зона осталась с
  // битыми ссылками после уборки. Ссылки на отдельные пакеты такого сделать не дают.
  mkdirSync(join(copy, "node_modules"), { recursive: true });
  for (const entry of readdirSync(join(pkgRoot, "node_modules"))) {
    if (MANAGER_INTERNALS.has(entry) || entry.startsWith(".vite")) continue;
    symlinkSync(join(pkgRoot, "node_modules", entry), join(copy, "node_modules", entry), "dir");
  }
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("оснастка собирается на установке", () => {
  it("манифест объявляет `prepare`, и он ведёт в сборку зоны", () => {
    expect(manifest.scripts?.prepare).toBe("pnpm run build");
  });

  it("в чистой копии зоны сборки нет — иначе проба зеленела бы от чужого следа", () => {
    expect(existsSync(join(copy, "dist"))).toBe(false);
  });

  it("`prepare` строит пакет с нуля: каждая цель `exports` появляется на диске", () => {
    // `--config.verify-deps-before-run=false` — про раскладку пробы, а не про предмет: в копии
    // нет lockfile'а, и pnpm перед запуском скрипта считает зависимости неустановленными и лезет
    // в `pnpm install`. У настоящего пакета рабочего пространства lockfile есть, и проверка
    // проходит молча.
    try {
      execFileSync("pnpm", ["--config.verify-deps-before-run=false", "run", "prepare"], {
        cwd: copy,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      // Без этого отказ читается как «Command failed» и причину приходится искать вслепую, а
      // причина у сборки всегда в её собственном выводе.
      const failure = error as { stdout?: string; stderr?: string };
      throw new Error(`\`prepare\` не собрал пакет:\n${failure.stdout}\n${failure.stderr}`);
    }

    // Целей у пресета одна точка, и обе её стороны порождает сборка — отбирать их по префиксу
    // здесь нечего: любая цель `exports`, которой после `prepare` нет на диске, это отказ.
    const missing = Object.values(manifest.exports)
      .flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)))
      .map((target) => target.replace(/^\.\//, ""))
      .filter((target) => !existsSync(join(copy, target)));

    expect(missing).toEqual([]);
  });
});
