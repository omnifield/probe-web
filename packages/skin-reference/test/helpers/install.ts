import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

// ЧИСТАЯ УСТАНОВКА из настоящего тарбола — механика гейта поставки.
//
// Форма взята у механики скина (`packages/skin/test/helpers/install.ts`), а та — у зоны
// значений: придумывать третий способ упаковаться и распаковаться незачем.
//
// Копия при этом уже ТРЕТЬЯ, и это тот же НАЗВАННЫЙ пробел, а не новый: помощники проб не едут
// в тарбол (`files` манифеста), значит поделиться ими между пакетами нечем. Общий дом для
// механики гейтов поставки — cross-zone решение, поднято архитектору.
//
// ## Зачем вообще установка, а не чтение манифеста
//
// Манифест расходится с фактом МОЛЧА: `files`, `exports` и то, что реально разрешится у
// потребителя, — три разные вещи, и узнаёт об этом он, а не мы. Здесь пакет действительно
// упаковывается, действительно распаковывается и действительно импортируется отдельным
// процессом, которому наш `node_modules` не виден.

export const PKG = "@omnifield/probe-web-skin-reference";
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

/**
 * Окружение для ДЕТЕЙ этого гейта: их вывод — данные, а не текст для человека.
 *
 * ## Почему точка запуска вообще думает об окраске
 *
 * Гейт РАЗБИРАЕТ то, что печатают дети: у `pnpm pack` берётся путь тарбола, у `tar` — перечень
 * путей, у `node` — напечатанный ответ, и сравнивается он ТОЧНО. Инструмент, решивший украсить
 * свой вывод, кладёт в эти строки управляющие последовательности, и данные перестают быть
 * данными. Оплачено `PWEB-58`: `console.log(true)` в ребёнке красит булево жёлтым, и точное
 * сравнение ловит `[33mtrue[39m` вместо `true`.
 *
 * Красит при этом не терминал. Стандартный вывод здесь труба, а не терминал, и сам по себе
 * окраску не включает — включает её УНАСЛЕДОВАННАЯ переменная `FORCE_COLOR`, которую ребёнок
 * получает от нас. Значит и гасить её надо здесь, на запуске ребёнка.
 *
 * ## Почему не снаружи
 *
 * Погасить окраску в сценарии зоны было бы обходом: способов запуска три (`pnpm test` из корня,
 * `pnpm test` в папке зоны, `npx nx`), и починился бы один. Проба, отвечающая по-разному на один
 * и тот же код, — ложный гейт: пару раз мигнув, он обесценивает и настоящую красноту.
 *
 * ## Почему обе переменные
 *
 * `FORCE_COLOR` читают первой и Node, и семейство `chalk` (её и наследуют — она же и виновата).
 * `NO_COLOR` — межинструментальный стандарт для тех, кто про `FORCE_COLOR` не знает. Порядок у
 * Node такой, что одна без другой оставила бы дыру: `FORCE_COLOR` перебивает `NO_COLOR`.
 *
 * Читается на КАЖДЫЙ запуск, а не один раз при загрузке модуля: иначе проба, включающая окраску
 * у себя, проверяла бы снимок окружения вместо настоящего пути.
 */
function plainEnv(): NodeJS.ProcessEnv {
  return { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" };
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
    env: plainEnv(),
  });
  const tarball = packed.trim().split("\n").at(-1) as string;

  const entries = execFileSync("tar", ["-tzf", tarball], { encoding: "utf8", env: plainEnv() })
    .trim()
    .split("\n")
    // npm-тарбол кладёт всё под `package/` — сравниваем пути такими, какими их увидит
    // потребитель после установки.
    .map((entry) => entry.replace(/^package\//, ""));

  const install = join(work, "consumer");
  mkdirSync(join(install, "node_modules", "@omnifield"), { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", work], { env: plainEnv() });
  execFileSync("mv", [join(work, "package"), join(install, "node_modules", PKG)], {
    env: plainEnv(),
  });
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
      env: plainEnv(),
    }).trim();
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    return `ОТКАЗ: ${`${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim()}`;
  }
}
