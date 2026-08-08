// Сборка CSS-артефактов пакета. Запускается ПОСЛЕ `tsc` — читает уже собранные токены,
// а не исходник: так генератор и рантайм-инжект берут значения из одного и того же модуля.
//
// `themes.css` не лежит в репозитории исходником намеренно. Файл с теми же значениями
// рядом с `tokens.ts` — это вторая копия правды, и она разъезжается: тест на синхронность
// ловит расхождение, но чинить его приходится руками при каждой правке темы. Генерация
// убирает саму возможность расхождения.

import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist/css");

const { DEFAULT_DARK, DEFAULT_LIGHT, themeToCss } = await import(
  pathToFileURL(resolve(root, "dist/tokens.js")).href
);

await mkdir(outDir, { recursive: true });

await copyFile(resolve(root, "src/css/base.css"), resolve(outDir, "base.css"));

const themes = `/* @omnifield/probe-web-style — дефолтная пара тем, подпуть
   \`@omnifield/probe-web-style/themes.css\`. Zero-config: \`:root\` — светлый режим,
   \`.dark\` — тёмный; \`data-theme\` остаётся кастомным палитрам (\`registerTheme()\`).

   ФАЙЛ СГЕНЕРИРОВАН из \`src/tokens.ts\` (\`scripts/build-css.mjs\`) — править его
   бесполезно, следующая сборка перезапишет. Значения живут в TS. */

${themeToCss(":root", DEFAULT_LIGHT)}

${themeToCss(":root.dark, .dark", DEFAULT_DARK)}
`;

await writeFile(resolve(outDir, "themes.css"), themes, "utf8");
