// Сборка поставки: два входа JS и декларации.
//
// ## Почему два входа, а не один
//
//   dist/index.js  ← `.`        — модель, проверки и ПОРОЖДЕНИЕ CSS
//   dist/model.js  ← `./model`  — модель и проверки, БЕЗ порождения
//   dist/*.d.ts    ← `types`    — декларации от того же tsc, что проверяет код
//
// Подпуть `./model` заведён ради того, что за порождением стоит: `@pandacss/core` тянет за
// собой postcss со спутниками. Читателю модели — хранилищу скинов, проверке сохранённой записи,
// редактору на стадии «человек ещё правит» — плоский текст CSS не нужен вовсе, и платить за
// него установкой postcss он не обязан. Обещание проверяет проба поверхности, а не намерение:
// она читает СОБРАННЫЙ файл и ищет в нём следы порождения.
//
// Обратное неверно: порождение стоит на модели, поэтому корневой вход отдаёт и её тоже.
//
// ## Почему bundle, а не пофайловый эмит, и почему esbuild
//
// Бандл снимает вопрос расширений и переписывания спецификаторов: внутренних импортов в нём
// нет. esbuild, а не tsup: tsup собирает ещё и декларации, своим конвейером поверх своей копии
// TypeScript, а продукт стоит на TS 7 — второй компилятор типов был бы вторым источником
// правды о них. Декларации остаются за `tsc`. Форма взята у зоны `assembly`.

import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(pkgRoot, "src");
const outDir = join(pkgRoot, "dist");

/** Общее для обоих выходов. */
const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2023",
  // Всё, что не относительный путь, — наружу. `@pandacss/core` приезжает зависимостью, кит —
  // одноранговой: копию паспортов приносит потребитель, две копии формы разъедутся.
  packages: "external",
  sourcemap: true,
  // Исходники в тарбол не едут (`files` манифеста) — карта обязана нести их в себе.
  sourcesContent: true,
};

rmSync(outDir, { recursive: true, force: true });

await build({ ...shared, entryPoints: [join(srcDir, "index.ts")], outfile: join(outDir, "index.js") });
await build({ ...shared, entryPoints: [join(srcDir, "model.ts")], outfile: join(outDir, "model.js") });

// Декларации. Отдельным процессом, потому что это другой инструмент и другой предмет: esbuild
// типы не проверяет вообще, он их вырезает.
execFileSync(
  process.execPath,
  [join(pkgRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
  { cwd: pkgRoot, stdio: "inherit" },
);
