// Оснастка собирается НА УСТАНОВКЕ (`PWEB-16`): у пакета есть жизненный цикл `prepare`, и
// менеджер зовёт его для пакетов воркспейса при `pnpm install`. Отсюда свойство, ради которого
// всё и делается: на свежем клоне дев-сервер приложения поднимается без отдельной команды
// сборки — хотя `vite.config.ts` потребителя импортирует собранный пресет.
//
// Почему это нельзя закрыть алиасом (как соседей — см. `dev-source.test.ts`): конфиг Vite
// грузит ДО того, как плагин из этого конфига успеет что-либо подменить. Инструмент, которым
// собирают, не может собираться собой же во время собственной загрузки.
//
// Проба утверждает НАШУ часть — что скрипт объявлен и что он действительно строит пакет с нуля.
// «Менеджер зовёт `prepare` на установке» — свойство менеджера, а не наше: проверять его здесь
// значило бы тестировать pnpm. Оно замерено натурально (чистый клон → `pnpm install` → подъём
// дев-сервера), и замер записан в задаче.

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
  workDir = mkdtempSync(join(tmpdir(), "probe-web-build-prepare-"));
  copy = join(workDir, "package");

  for (const entry of SOURCES) {
    cpSync(join(pkgRoot, entry), join(copy, entry), { recursive: true });
  }

  // Зависимости не ставим заново — берём поставленные в зоне: предмет пробы это сборка, а не
  // скорость менеджера. Но `node_modules` копии — РЕАЛЬНАЯ папка со ссылками внутрь, а не одна
  // ссылка на папку зоны. Разница дорогая и замерена 2026-08-19: копия без lockfile'а заставляет
  // pnpm перед запуском скрипта позвать `pnpm install`, и по ссылке-папке он переписал
  // `node_modules` САМОЙ ЗОНЫ на дерево во временном каталоге — зона осталась с битыми ссылками
  // после уборки. Ссылки на отдельные пакеты такого сделать не дают.
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
    // в `pnpm install`. У настоящего пакета воркспейса lockfile есть, и проверка проходит молча.
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

    const missing = Object.values(manifest.exports)
      .flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)))
      .map((target) => target.replace(/^\.\//, ""))
      // `tsconfig.base.json` лежит файлом пакета и сборкой не порождается — здесь проверяется
      // именно то, что даёт `prepare`.
      .filter((target) => target.startsWith("dist/"))
      .filter((target) => !existsSync(join(copy, target)));

    expect(missing).toEqual([]);
  });
});
