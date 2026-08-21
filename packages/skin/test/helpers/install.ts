import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

// ЧИСТАЯ УСТАНОВКА из настоящего тарбола — механика гейта поставки.
//
// Форма взята у зоны значений (`packages/style/test/helpers/install.ts`): там этот гейт уже
// стоит, и придумывать второй способ упаковаться и распаковаться незачем.
//
// Копия при этом всё-таки вторая, и это НАЗВАННЫЙ пробел: помощники проб не едут в тарбол
// (`files` манифеста), значит поделиться ими между зонами нечем. Общий дом для механики гейтов
// поставки — cross-zone решение, поднято архитектору.
//
// ## Зачем вообще установка, а не чтение манифеста
//
// Манифест расходится с фактом МОЛЧА: `files`, `exports` и то, что реально разрешится у
// потребителя, — три разные вещи, и узнаёт об этом он, а не мы. Здесь пакет действительно
// упаковывается, действительно распаковывается и действительно импортируется отдельным
// процессом, которому наш `node_modules` не виден.

export const PKG = "@omnifield/probe-web-skin";
export const pkgRoot = resolve(import.meta.dirname, "..", "..");

const require = createRequire(import.meta.url);

export interface Installed {
  /** Временный корень: распаковка и потребитель. Снести целиком в `afterAll`. */
  work: string;
  /** Папка «потребителя»: рядом лежит `node_modules/<PKG>` с содержимым тарбола. */
  install: string;
  /** Пути внутри тарбола БЕЗ префикса `package/` — такими их увидит потребитель. */
  entries: string[];
}

/** Корень пакета по его имени — там, где он лежит на самом деле. */
function packageRoot(name: string): string {
  // Идём от разрешённого файла вверх до папки с манифестом: у каждого пакета своя раскладка
  // сборки, и вычислять вход по имени значило бы завести знание о чужой раскладке.
  let dir = dirname(require.resolve(name));
  while (!existsSync(join(dir, "package.json"))) dir = dirname(dir);
  return dir;
}

/**
 * Пакует зону и распаковывает её в свежую папку-потребителя.
 *
 * @param prefix префикс временной папки — чтобы в `/tmp` было видно, чей это прогон
 */
export function installFromTarball(prefix: string): Installed {
  const work = mkdtempSync(join(tmpdir(), prefix));

  const packed = execFileSync("pnpm", ["pack", "--pack-destination", work], {
    cwd: pkgRoot,
    encoding: "utf8",
  });
  const tarball = packed.trim().split("\n").at(-1) as string;

  const entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8" })
    .trim()
    .split("\n")
    // npm-тарбол кладёт всё под `package/` — сравниваем пути такими, какими их увидит
    // потребитель после установки.
    .map((entry) => entry.replace(/^package\//, ""));

  const install = join(work, "consumer");
  mkdirSync(join(install, "node_modules", "@omnifield"), { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", work]);
  execFileSync("mv", [join(work, "package"), join(install, "node_modules", PKG)]);
  rmSync(tarball, { force: true });

  return { work, install, entries };
}

/**
 * Кладёт пакет рядом с потребителем — ссылкой на то, что уже установлено.
 *
 * Ссылкой, а не сетью: гейт обязан работать без выхода наружу. Node разрешает зависимости от
 * НАСТОЯЩЕГО пути файла, поэтому связанный пакет находит свои собственные зависимости там же,
 * где они лежат сейчас.
 *
 * @param install папка потребителя
 * @param name имя пакета
 */
export function link(install: string, name: string): void {
  const at = join(install, "node_modules", name);
  mkdirSync(dirname(at), { recursive: true });
  symlinkSync(packageRoot(name), at, "dir");
}

/**
 * Пробует импорт В УСТАНОВКЕ ПОТРЕБИТЕЛЯ, отдельным процессом.
 *
 * Отдельным — потому что иначе спецификатор разрешился бы по нашему `node_modules`, и гейт
 * проверял бы наше дерево вместо поставки.
 *
 * @param install папка потребителя
 * @param code тело модуля; в нём доступен только тот, кто действительно установлен
 * @returns напечатанное при успехе, либо текст отказа с пометкой `ОТКАЗ:`
 */
export function runInInstall(install: string, code: string): string {
  try {
    return execFileSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: install,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    return `ОТКАЗ: ${`${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim()}`;
  }
}
