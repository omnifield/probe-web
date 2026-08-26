// Сборка поставки: два входа JS и декларации.
//
// ## Почему два входа, а не один
//
//   dist/index.js  ← `.`        — модель, проверки и ПОРОЖДЕНИЕ CSS во вложенной форме
//   dist/model.js  ← `./model`  — модель и проверки, БЕЗ порождения
//   dist/flat.js   ← `./flat`   — разворот вложенного в плоский, и ТОЛЬКО он
//   dist/editor.js ← `./editor` — срез РЕДАКТОРА паспорта: `means`, род, группа, сборки (`PWEB-115`)
//   dist/*.d.ts    ← `types`    — декларации от того же tsc, что проверяет код
//
// Входов четыре, и делит их РОВНО ОДНО: что попадёт в сборку потребителя.
//
// `./editor` — не просто ещё один вход по тому же шаблону, а сама граница `PWEB-115`: `index.ts`
// и `model.ts` физически не импортируют ничего из `passport-editor.ts`/`passport-assembly.ts`
// (проверено — граф импортов, не обещание), и esbuild с `bundle: true` кладёт в файл только
// ДОСТИЖИМОЕ из entry point. Значит `means`, род, группа и сборки не проникают в `dist/index.js`/
// `dist/model.js` уже на этом уровне — до всякой сборки потребителя.
//
// За разворачиванием стоит postcss со спутниками, и он попадает в сборку от одного импорта —
// звали его или нет. Значит он обязан жить за собственным входом: витрина и редактор порождают
// CSS на каждое движение ручки и вложенную форму отдают браузеру как есть (вложенность CSS —
// Baseline Widely Available с 11 июня 2026). Замерено: витрина с postcss в цепочке — 257,06 КБ.
//
// `./model` — тот же приём на ступень раньше: хранилищу и проверке сохранённой записи не нужна
// даже печать. Обещания проверяет проба поверхности, а не намерение: она читает СОБРАННЫЕ файлы.
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

for (const entry of ["index", "model", "flat", "editor"]) {
  await build({
    ...shared,
    entryPoints: [join(srcDir, `${entry}.ts`)],
    outfile: join(outDir, `${entry}.js`),
  });
}

// Декларации. Отдельным процессом, потому что это другой инструмент и другой предмет: esbuild
// типы не проверяет вообще, он их вырезает.
execFileSync(
  process.execPath,
  [join(pkgRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
  { cwd: pkgRoot, stdio: "inherit" },
);
