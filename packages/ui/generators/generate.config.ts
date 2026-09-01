// Четыре агрегирующих входа кита (`src/passport.ts`, `src/kit.ts`, `src/io.ts`, `src/index.ts`) —
// данные/сборка/запись целиком в `@probe-web/generators/plugins/kit` (`GEN-9`): это — реальный
// готовый плагин, не движок, не логика ЭТОГО файла. Здесь остаются только пути: где `src`, где
// `templates/barrel/*.hbs` (текст самих барелей — CSS-по-аналогии, свой на кит, не общий).
// Прогоняется через `node ../../products/generators/dist/cli.js ./generate.config.ts`.
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, hasFile } from "@probe-web/generators/engine";
import { kitBarrelPlugins } from "@probe-web/generators/plugins/kit";

const thisDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(thisDir, "..", "src");

export default defineConfig({
  rootDir: srcDir,
  isEntry: hasFile("entity/passport.ts"),
  plugins: kitBarrelPlugins({
    outputDir: srcDir,
    templatesDir: join(thisDir, "templates", "barrel"),
  }),
});
