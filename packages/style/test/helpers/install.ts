import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Чистая установка пакета из НАСТОЯЩЕГО тарбола — общая механика гейтов поставки.
// Живёт одним куском намеренно: две копии этой сборки разъехались бы, и один гейт стал бы
// проверять не то, что второй, — ровно тот класс дефекта, из-за которого тесты и появились.

export const PKG = "@omnifield/probe-web-style";
export const pkgRoot = resolve(import.meta.dirname, "..", "..");

export interface Installed {
  /** Временный корень: тарбол, распаковка, потребитель. Снести целиком в `afterAll`. */
  work: string;
  /** Папка «потребителя»: рядом лежит `node_modules/<PKG>` с содержимым тарбола. */
  install: string;
  /** Пути внутри тарбола БЕЗ префикса `package/` — такими их увидит потребитель. */
  entries: string[];
}

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

  // «Чистая установка» без dev-обвеса: распакованный тарбол лежит там, где его ищет
  // резолвер Node, и подпуть проверяется по `exports`, а не по угаданному пути в dist.
  const install = join(work, "consumer");
  mkdirSync(join(install, "node_modules", "@omnifield"), { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", work]);
  execFileSync("mv", [join(work, "package"), join(install, "node_modules", PKG)]);
  rmSync(tarball, { force: true });

  return { work, install, entries };
}
