// Генерация CSS встроенных пресетов.
//
// ЗАЧЕМ ФАЙЛЫ, если пресет и так описан объектом. Потому что «указать пресет и поставить» должно
// работать без сборки и без единой строки JS: приложение подключает файл и ставит атрибут. Объект
// остаётся источником, файл — поставкой.
//
// Файлы СГЕНЕРИРОВАНЫ: править их бесполезно, следующий запуск перезапишет. Что они не отстали от
// источника, стережёт `test/presets-css.test.ts` — он сравнивает файл с тем, что даёт модель.
//
// СТРОКУ СОБИРАЕТ БАЗА (`themeModelToCss`), зона даёт ей модель (`kb:PROBEWEB-15`, решение 2).
// Своего генератора здесь нет: две реализации из одной модели дают два результата.
//
// Запуск: `pnpm run build:presets` (нужен Node с разбором типов на лету и собранный `style`).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "presets", "css");

const { themeModelToCss } = await import("@omnifield/probe-web-style");
const { BUILT_IN } = await import("../src/presets/built-in.ts");
const { modelOf } = await import("../src/presets/model.ts");

mkdirSync(out, { recursive: true });

for (const preset of BUILT_IN) {
  writeFileSync(join(out, `${preset.id}.css`), themeModelToCss(modelOf(preset)), "utf8");
  console.log(`пресет «${preset.title}» → src/presets/css/${preset.id}.css`);
}
