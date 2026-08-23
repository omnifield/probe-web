// Сборка поставки: ДВЕ ветки JS из одного исходника плюс декларации.
//
// ## Почему веток две
//
// Зона `ui` — единственная в продукте, которая отдаёт JSX. Потребитель на Solid обязан
// применить СВОЮ трансформацию: она компиляторная (`babel-preset-solid` разбирает JSX в
// прямые операции над DOM), поэтому уже преобразованный код подстроить под цель — браузер,
// SSR, гидратацию — нельзя. Отсюда условие экспорта `solid` с непреобразованным JSX
// (`tsup-preset-solid`, фонд, сверено 2026-08-08).
//
// Ветка `default` нужна тем, кто про условие `solid` не знает: без неё импорт пакета
// не-Solid-инструментом падает на первом же `<div>`.
//
//   dist/index.jsx  ← условие `solid`  — JSX как написан
//   dist/index.js   ← `default`        — JSX, разобранный babel-preset-solid
//   dist/index.d.ts ← `types`          — декларации от того же tsc, что проверяет код
//
// ## Почему bundle, а не пофайловый эмит
//
// Из-за расширений. `tsc` с `jsx: preserve` кладёт `.tsx` → `.jsx`, а импорты в них остаются
// такими, как в исходнике; собрать пару «файл `.jsx` + рядом файл `.js`» без переписывания
// спецификаторов нельзя. Бандл эту задачу снимает: внутренних импортов в нём просто нет.
// Так же собраны обе библиотеки, с которых мы брали форму `exports` (`@kobalte/core@0.13.12`
// и `@corvu/resizable@0.2.5` — tsup поверх esbuild; сверено 2026-08-08).
//
// Tree-shaking от бандла не страдает: выход — ESM с `sideEffects: false`, и неиспользованный
// примитив сборщик потребителя выбрасывает по графу экспортов, а не по числу файлов.
//
// ## Почему esbuild, а не tsup
//
// tsup собирает и декларации — своим конвейером (`rollup-plugin-dts`) поверх своей копии
// TypeScript. Продукт стоит на TS 7.0.2, и зона `lint` уже поймала, что инструменты рынка за
// этим мажором ещё не поспели. Второй компилятор типов в пакете — второй источник правды о
// типах; декларации остаются за `tsc`, а esbuild делает ровно то, за чем его берут.

import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

// Порождение входов — ДО первого прохода esbuild: `src/index.ts` ссылается на карту, а
// `src/passport.ts` и есть точка входа подпути. Побочным действием импорта, а не вызовом:
// у файла одна работа, и звать её отдельно значило бы разрешить импорт без неё.
import "./generate.mjs";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(pkgRoot, "src");
const entry = join(srcDir, "index.ts");
const passportEntry = join(srcDir, "passport.ts");
const outDir = join(pkgRoot, "dist");

/** Общее для обеих веток. */
const shared = {
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2023",
  // Всё, что не относительный путь, — наружу. `solid-js` и `@kobalte/core` стоят в
  // `peerDependencies`: копию Solid приносит потребитель, две копии в дереве ломают
  // реактивность (норма фонда `solid-js-multiple-instances`).
  packages: "external",
  sourcemap: true,
  // Исходники в тарбол не едут (`files` манифеста) — карта обязана нести их в себе, иначе у
  // потребителя она указывает в пустоту.
  sourcesContent: true,
};

rmSync(outDir, { recursive: true, force: true });

// Ветка `solid`: JSX сохраняется как есть, снимаются только типы.
await build({
  ...shared,
  jsx: "preserve",
  outfile: join(outDir, "index.jsx"),
});

// Ветка `default`: тот же исходник через babel-preset-solid.
await build({
  ...shared,
  plugins: [solidPlugin()],
  outfile: join(outDir, "index.js"),
});

// Подпуть `./passport` — ДАННЫЕ, а не разметка: JSX внутри нет, поэтому ветка одна.
// Вход порождён обходом папок (`scripts/generate.mjs`); наружу уезжает форма, правило допуска,
// читатель под вид (мост узел→координата, `PWEB-27`), перечень паспортов и чтение по имени.
// Отдельный выход, а не кусок корневого бандла: читатель паспорта (механика скина, редактор,
// чужой инструмент) не должен тянуть за собой ни Solid, ни `@kobalte/core` ради перечня частей.
//
// КАРТЫ частей здесь нет и быть не может — её значения это компоненты Solid (`PWEB-84`). Она
// уезжает корневым входом, вместе с паспортом одним значением; разбор — в `src/kit-form.ts`.
await build({
  ...shared,
  entryPoints: [passportEntry],
  outfile: join(outDir, "passport.js"),
});

// Декларации. Отдельным процессом, потому что это другой инструмент и другой предмет:
// esbuild типы не проверяет вообще, он их вырезает.
execFileSync(
  process.execPath,
  [join(pkgRoot, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.build.json"],
  { cwd: pkgRoot, stdio: "inherit" },
);
