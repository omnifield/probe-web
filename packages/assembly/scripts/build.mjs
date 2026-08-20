// Сборка поставки: две ветки JS корневого входа, один выход подпути `./model` и декларации.
//
// ## Почему у корневого входа две ветки
//
// Зона отдаёт наружу JSX — отрисовку. Потребитель на Solid обязан применить СВОЮ
// трансформацию: она компиляторная (`babel-preset-solid` разбирает JSX в прямые операции над
// DOM), поэтому уже преобразованный код подстроить под цель — браузер, SSR, гидратацию —
// нельзя. Отсюда условие экспорта `solid` с непреобразованным JSX. Ветка `default` нужна тем,
// кто про это условие не знает: без неё импорт пакета не-Solid-инструментом падает на первом
// же `<span>`. Ту же форму держит зона `ui`, оттуда и взято (сверено с `tsup-preset-solid`).
//
//   dist/index.jsx  ← условие `solid`  — JSX как написан
//   dist/index.js   ← `default`        — JSX, разобранный babel-preset-solid
//   dist/model.js   ← подпуть `./model`— модель и правила, Solid внутри нет вовсе
//   dist/*.d.ts     ← `types`          — декларации от того же tsc, что проверяет код
//
// ## Почему подпуть `./model` собирается отдельно, а не отрезается от корневого бандла
//
// Отрезать нечем: у бандла один вход. Второй выход — это ровно то обещание, ради которого
// подпуть заведён: читателю правил (хранилище, проверка сохранённого дерева, сборка на
// сервере) не должно приезжать ни Solid, ни отрисовки. Проверяет это проба поверхности, а не
// намерение — она читает собранный файл.
//
// ## Почему bundle, а не пофайловый эмит, и почему esbuild
//
// Из-за расширений: `tsc` с `jsx: preserve` кладёт `.tsx` → `.jsx`, а импорты внутри остаются
// как в исходнике, и пара «файл `.jsx` рядом с файлом `.js`» без переписывания спецификаторов
// не собирается. Бандл эту задачу снимает — внутренних импортов в нём нет.
//
// esbuild, а не tsup: tsup собирает ещё и декларации, своим конвейером поверх своей копии
// TypeScript. Продукт стоит на TS 7, и второй компилятор типов в пакете — второй источник
// правды о них. Декларации остаются за `tsc`.

import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(pkgRoot, "src");
const outDir = join(pkgRoot, "dist");

/** Общее для всех выходов. */
const shared = {
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2023",
  // Всё, что не относительный путь, — наружу. `solid-js` стоит в `peerDependencies`: копию
  // Solid приносит потребитель, две копии в дереве ломают реактивность.
  packages: "external",
  sourcemap: true,
  // Исходники в тарбол не едут (`files` манифеста) — карта обязана нести их в себе.
  sourcesContent: true,
};

rmSync(outDir, { recursive: true, force: true });

// Ветка `solid`: JSX сохраняется как есть, снимаются только типы.
await build({
  ...shared,
  entryPoints: [join(srcDir, "index.ts")],
  jsx: "preserve",
  outfile: join(outDir, "index.jsx"),
});

// Ветка `default`: тот же исходник через babel-preset-solid.
await build({
  ...shared,
  entryPoints: [join(srcDir, "index.ts")],
  plugins: [solidPlugin()],
  outfile: join(outDir, "index.js"),
});

// Подпуть `./model` — ДАННЫЕ и правила: JSX внутри нет, поэтому ветка одна.
await build({
  ...shared,
  entryPoints: [join(srcDir, "model.ts")],
  outfile: join(outDir, "model.js"),
});

// Декларации. Отдельным процессом, потому что это другой инструмент и другой предмет: esbuild
// типы не проверяет вообще, он их вырезает.
execFileSync(
  process.execPath,
  [join(pkgRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
  { cwd: pkgRoot, stdio: "inherit" },
);
