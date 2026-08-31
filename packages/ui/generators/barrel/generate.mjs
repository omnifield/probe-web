// ПОРОЖДЕНИЕ ВХОДОВ — четыре барреля (паспорт, кит, `./io`, корневой markup-вход), собираемых
// обходом папок компонентов. Паспорт, кит и корневой вход — ОБЯЗАТЕЛЬНЫ у каждого компонента;
// паспорт формы, `./io`, — НЕОБЯЗАТЕЛЕН (`PWEB-180` продолжение).
//
// Зачем отдельный шаг, а не часть сборки, и зачем перечни ведёт обход, а не файл, который правят
// руками, — разобрано в `README.md` этой папки, не здесь: то были доводы про порядок сборки и
// про круг «один правит — ломается у второго», к этому файлу они не привязаны и не должны в нём
// перечитываться при каждой правке.
//
// Сам текст каждого барреля — в `templates/*.ts.hbs` (движок шаблонов — `@probe-web/generators/barrel`,
// `PWEB-205`). Здесь — только то, что знает про раскладку ЭТОГО кита: где у компонента паспорт,
// где карта частей, как называется модуль, который барель импортирует.
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverEntries, fromTemplate, generateBarrels, identifierFromEntryName, writeGeneratedFiles } from "@probe-web/generators/barrel";

const thisDir = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(thisDir, "..", "..");
const srcDir = join(pkgRoot, "src");
const templatesDir = join(thisDir, "templates");

/**
 * Имя файла карты частей на диске — `.tsx`, если реализация компонента и карта живут в одном
 * файле (`PWEB-195` продолжение, 2026-08-30 — `index`/`kit` поменялись местами: настоящий код
 * лежит там, где раньше была только карта, а `.tsx` он потому, что там теперь и JSX), иначе
 * старая раскладка, `.ts` (карта отдельно, реализация — в `components/index.tsx`). Оба варианта
 * законны — читаем диск, а не считаем один устаревшим.
 */
function kitFileOf(entryPath) {
  if (existsSync(join(entryPath, "components", "kit.tsx"))) return "kit.tsx";
  if (existsSync(join(entryPath, "components", "kit.ts"))) return "kit.ts";
  return undefined;
}

function isComponentEntry(entryPath) {
  return existsSync(join(entryPath, "entity", "passport.ts"));
}

const entries = discoverEntries(srcDir, { isEntry: isComponentEntry });

if (entries.length === 0) {
  throw new Error("в `src/` нет ни одной папки компонента с анатомией — подпуть паспорта пуст");
}

const files = await generateBarrels(entries, [
  {
    outputPath: join(srcDir, "passport.ts"),
    collect: (items) =>
      items.map((item) => ({
        passportIdentifier: identifierFromEntryName(item.name, "Passport"),
        editorInfoIdentifier: identifierFromEntryName(item.name, "EditorInfo"),
        passportModule: `${item.name}/entity/passport.js`,
        editorInfoModule: `${item.name}/playground/index.js`,
      })),
    render: fromTemplate(join(templatesDir, "passport.ts.hbs")),
  },
  {
    outputPath: join(srcDir, "kit.ts"),
    collect: (items) =>
      items.map((item) => {
        const kitFile = kitFileOf(item.path);
        return {
          name: item.name,
          kitFile,
          kitIdentifier: identifierFromEntryName(item.name, "Kit"),
          kitModule: kitFile && `${item.name}/components/${kitFile === "kit.tsx" ? "kit.jsx" : "kit.js"}`,
        };
      }),
    // Объявил анатомию — обязан назвать, чем её части рисуются. Молчаливого пропуска здесь нет:
    // компонент без карты уехал бы в поставку паспортом, который нечем отрисовать, и узнал бы об
    // этом потребитель — на неодетом узле, а не на нашем прогоне.
    validate: (items) => {
      const withoutMap = items.filter((item) => item.kitFile === undefined).map((item) => item.name);
      if (withoutMap.length > 0) {
        throw new Error(`паспорт есть, карты нет — папки без карты частей: ${withoutMap.join(", ")}`);
      }
    },
    render: fromTemplate(join(templatesDir, "kit.ts.hbs")),
  },
  {
    outputPath: join(srcDir, "io.ts"),
    collect: (items) =>
      items
        .filter((item) => existsSync(join(item.path, "entity", "io.ts")))
        .map((item) => ({
          passportIdentifier: identifierFromEntryName(item.name, "Passport"),
          ioIdentifier: identifierFromEntryName(item.name, "Io"),
          passportModule: `${item.name}/entity/passport.js`,
          ioModule: `${item.name}/entity/io.js`,
        })),
    render: fromTemplate(join(templatesDir, "io.ts.hbs")),
  },
  {
    outputPath: join(srcDir, "index.ts"),
    collect: (items) => items.map((item) => ({ name: item.name })),
    render: fromTemplate(join(templatesDir, "index.ts.hbs")),
  },
]);

writeGeneratedFiles(files);
