// Сборка поставки: один вход JS и декларации.
//
//   dist/index.js  ← `.`      — сама запись эталона и названное непокрытое
//   dist/index.d.ts ← `types` — декларации от того же tsc, что проверяет код
//
// ## Вход ОДИН, и это свойство предмета
//
// У механики входов три, и делит их ровно одно: что попадёт в сборку потребителя. Здесь делить
// нечего — эталон это ДАННЫЕ, и они не тянут ни строки чужого кода. Тип `Skin` приходит
// `import type` и стирается при эмите, поэтому в собранном файле нет ни одного импорта вовсе.
// Держит это проба поверхности, а не обещание.
//
// ## Почему bundle, а не пофайловый эмит, и почему esbuild
//
// Бандл снимает вопрос расширений и переписывания спецификаторов: внутренних импортов в нём
// нет. esbuild, а не tsup: tsup собирает ещё и декларации, своим конвейером поверх своей копии
// TypeScript, а продукт стоит на TS 7 — второй компилятор типов был бы вторым источником правды
// о них. Декларации остаются за `tsc`. Форма взята у механики скина.

import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(pkgRoot, "src");
const outDir = join(pkgRoot, "dist");

rmSync(outDir, { recursive: true, force: true });

await build({
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
  // Всё, что не относительный путь, — наружу. Механика и кит приезжают одноранговыми: копию
  // их формы приносит потребитель, две копии разъехались бы.
  packages: "external",
  sourcemap: true,
  // Исходники в тарбол не едут (`files` манифеста) — карта обязана нести их в себе.
  sourcesContent: true,
  entryPoints: [join(srcDir, "index.ts")],
  outfile: join(outDir, "index.js"),
});

// Декларации. Отдельным процессом, потому что это другой инструмент и другой предмет: esbuild
// типы не проверяет вообще, он их вырезает.
execFileSync(
  process.execPath,
  [join(pkgRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
  { cwd: pkgRoot, stdio: "inherit" },
);
