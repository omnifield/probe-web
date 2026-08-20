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
import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

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

// ПЕРЕЧЕНЬ КОМПОНЕНТОВ ПОРОЖДАЕТСЯ ЗДЕСЬ — обходом папок, а не файлом, в который дописывает
// строку каждый новый компонент. У такого файла один владелец и очередь из всех остальных; это
// и есть механизм, которым зоны ломают друг друга. Забыл вписать — паспорт молча не уехал бы в
// поставку, и узнал бы об этом скин, а не мы.
//
// Компонент считается объявившим себя, если в его папке лежит `<имя>.anatomy.ts` с экспортом
// `passport`. Ни списка, ни порядка руками: порядок — алфавитный, чтобы порождённый файл не
// менялся от порядка чтения каталога.

/** Папки компонентов, объявивших анатомию. */
function componentFolders() {
  return readdirSync(srcDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => existsSync(join(srcDir, name, `${name}.anatomy.ts`)))
    .sort();
}

/** Имя папки → имя переменной: `number-field` → `numberFieldPassport`. */
function identifierOf(folder) {
  return `${folder.replace(/-(.)/g, (_, letter) => letter.toUpperCase())}Passport`;
}

/** Собирает исходник подпути `./passport` — вход, который читают скин и редактор. */
function renderPassportEntry(folders) {
  const imports = folders
    .map((folder) => `import { passport as ${identifierOf(folder)} } from "./${folder}/${folder}.anatomy.js";`)
    .join("\n");
  const entries = folders
    .map((folder) => `  [${identifierOf(folder)}.component]: ${identifierOf(folder)},`)
    .join("\n");

  return `// ПОРОЖДЁН СБОРКОЙ (\`scripts/build.mjs\`) — НЕ ПРАВИТЬ И НЕ КОММИТИТЬ.
//
// Перечень паспортов собирается обходом папок \`src/*/<имя>.anatomy.ts\`: компонент объявляет
// себя в своей папке, и попадает в поставку самим фактом объявления. Руками этот файл не
// ведётся — иначе он стал бы тем самым общим файлом, который правят все.

import type { ComponentPassport } from "./passport-form.js";
${imports}

export * from "./passport-form.js";

/**
 * Паспорта пакета по имени компонента.
 *
 * Перечень, а не «сколько их»: число устаревает при добавлении каждого следующего паспорта, а
 * форма чтения — нет. Компонент без паспорта здесь отсутствует ЧЕСТНО: его ещё не одевали, и
 * молчаливая заглушка выглядела бы как объявленный контракт.
 */
export const PASSPORTS: Readonly<Record<string, ComponentPassport>> = {
${entries}
};

/**
 * Паспорт по имени компонента, либо \`undefined\` — если компонент его ещё не объявил.
 *
 * @param component имя компонента, оно же \`data-scope\` на каждом его узле
 */
export function passportOf(component: string): ComponentPassport | undefined {
  return PASSPORTS[component];
}
`;
}

const folders = componentFolders();

if (folders.length === 0) {
  throw new Error("в `src/` нет ни одной папки компонента с анатомией — подпуть паспорта пуст");
}

writeFileSync(passportEntry, renderPassportEntry(folders), "utf8");

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
// Вход порождён выше обходом папок; наружу уезжает форма, перечень паспортов и чтение по имени.
// Отдельный выход, а не кусок корневого бандла: читатель паспорта (механика скина, редактор,
// чужой инструмент) не должен тянуть за собой ни Solid, ни `@kobalte/core` ради перечня частей.
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
