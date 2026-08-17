// Сборка CSS-артефактов пакета. Запускается ПОСЛЕ `tsc` — читает уже собранные модули,
// а не исходники: так генератор и рантайм-инжект берут значения из одного и того же места.
//
// Что генерируется и почему:
//   • `themes.css` — значения ступеней дефолтной пары. Файл с теми же числами рядом с
//     `tokens.ts` был бы второй копией правды, и она разъезжается.
//   • `base.css` — ручная часть (`src/css/base.css`) ПЛЮС три блока, собранные из данных:
//     производные размерные шкалы, семантические роли, устаревшие псевдонимы. Перечни ступеней
//     и ролей уже существуют массивами в TS; переписать их сюда текстом значило бы завести
//     список, который надо синхронизировать руками при каждой правке.
//
// Правка `dist` бесполезна: следующая сборка перезапишет.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "dist/css");
const load = (name) => import(pathToFileURL(resolve(root, `dist/${name}.js`)).href);

const { DEFAULT_DARK, DEFAULT_LIGHT, themeToCss } = await load("tokens");
const { derivedCss } = await load("dimension");
const { layerCss } = await load("layer");
const { legacyCss, rolesCss } = await load("roles");

await mkdir(outDir, { recursive: true });

const generated = (what) =>
  `/* ─────────────────────────────────────────────────────────────────────────────
   ${what}
   СГЕНЕРИРОВАНО \`scripts/build-css.mjs\`. Править бесполезно — перезапишет.
   ───────────────────────────────────────────────────────────────────────────── */`;

const base = [
  await readFile(resolve(root, "src/css/base.css"), "utf8"),
  generated("Размерные шкалы: производные от семян, ось плотности (`src/dimension.ts`)."),
  derivedCss(),
  generated("Шкала слоёв: объявленный порядок того, что лежит поверх страницы (`src/layer.ts`)."),
  layerCss(),
  generated(
    "Семантические роли: роль ССЫЛАЕТСЯ на ступень, а не хранит цвет (`src/roles.ts`).",
  ),
  rolesCss(),
  generated(
    "УСТАРЕВШИЕ имена прежнего плоского набора, выраженные через роли (`src/roles.ts`).\n   Удаление — мажорным поднятием версии, не раньше.",
  ),
  legacyCss(),
].join("\n\n");

await writeFile(resolve(outDir, "base.css"), `${base}\n`, "utf8");

const themes = `/* @omnifield/probe-web-style — дефолтная пара тем, подпуть
   \`@omnifield/probe-web-style/themes.css\`. Zero-config: \`:root\` — светлый режим,
   \`.dark\` — тёмный; \`data-theme\` остаётся кастомным палитрам (\`registerTheme()\`).

   Здесь только ЗНАЧЕНИЯ СТУПЕНЕЙ. Роли, которые на эти ступени ссылаются, живут в
   \`base.css\`: они одинаковы для всех тем, и копия в каждой палитре означала бы, что
   разделение шкалы и роли объявлено, но не сделано.

   ФАЙЛ СГЕНЕРИРОВАН из \`src/tokens.ts\` (\`scripts/build-css.mjs\`) — править его
   бесполезно, следующая сборка перезапишет. Значения считаются из семян при сборке. */

${themeToCss(":root", DEFAULT_LIGHT)}

${themeToCss(":root.dark, .dark", DEFAULT_DARK)}
`;

await writeFile(resolve(outDir, "themes.css"), themes, "utf8");
