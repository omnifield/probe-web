// Запись CSS-артефактов поставки. Сценарий ТОНКИЙ намеренно: он только кладёт на диск то,
// что породил модуль зоны (`src/css/generate.ts`).
//
// Раньше склейка жила прямо здесь, и это значило, что породить CSS умеет ОДНА сборка: в
// разработке приложение показывало результат прошлой сборки, а правка перечня доезжала до
// глаз только следующей ручной командой (`PWEB-20`). Теперь порождение — обычная функция
// зоны, и звать её может кто угодно, в том числе дев-сервер, в момент запроса.
//
// Артефакт ОДИН: базовый слой. Файла палитры больше нет — надеваемой палитры по умолчанию у
// зоны не осталось (`PWEB-50`).
//
// Импорт идёт из `dist`, потому что сценарий исполняет node, а не сборщик: он запускается
// сразу после `tsc` и берёт ровно то, что тот собрал. Склейки здесь нет и быть не должно —
// это держит проба (`test/generate.test.ts`), а не памятка в шапке.

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist/css");

const generate = await import(pathToFileURL(resolve(root, "dist/css/generate.js")).href);

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, "base.css"), generate.baseCss(), "utf8");
