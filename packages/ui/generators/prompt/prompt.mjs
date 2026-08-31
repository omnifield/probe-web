// ГЕНЕРАЦИЯ ПРОМПТА ДЛЯ АГЕНТА (PWEB-205, 2026-08-30) — черновая, первая версия. Постановка user:
// «то, что мы достали автоматом, — данные, на которые агент опирается; писать прозу и примеры —
// дело мощной модели, не таблиц». Этот генератор не пишет доку сам и не зовёт никакую модель —
// он собирает ПРОМПТ (текстовый файл), который затем читает агент отдельным шагом.
//
// Данные — СЫРЫЕ, необработанные (в отличие от `../readme/readme.mjs`, который аккуратно
// раскладывает паспорт в строки таблицы): агент сам решает, что взять из паспорта/editorInfo и
// куда подставить, а не получает уже нарезанный набор колонок.
//
// ТРЕТИЙ ИСТОЧНИК — реальный текст `components/kit.tsx` (2026-08-30): паспорт/editorInfo несут
// ЧТО есть (части/состояния/настройки), но не РЕАЛЬНЫЕ props и не рабочий пример JSX-композиции —
// это только в самом исходнике (уже есть `@example` в JSDoc у части компонентов, см. accordion).
// Без него агент писал бы usage-примеры угадыванием по названиям частей. Путь фиксирован
// конвенцией кита (`generators/barrel/README.md` — `<имя>/components/kit.tsx`), читается как
// обычный текст файла, не исполнением: агенту нужен именно ТЕКСТ (комментарии, JSDoc, формат
// импортов), а не то, что модуль экспортирует в рантайме.
//
// Вывод — `out/<имя>.md`, НЕ в папку компонента: это черновик для агента, не часть кита, и не
// файл, который кто-то держит открытым и правит руками (в отличие от `README.md` компонента).
// `out/` под `.gitignore`.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverEntries, fromEntryTemplate, writeGeneratedFiles } from "@probe-web/generators/barrel";
import { importModule } from "@probe-web/generators/extract";
import { generateScaffoldFiles } from "@probe-web/generators/scaffold";

const thisDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(resolve(thisDir, "..", ".."), "src");
const outDir = join(thisDir, "out");

const kitContext = readFileSync(join(thisDir, "kit-context.md"), "utf8");

function isComponentEntry(entryPath) {
  return existsSync(join(entryPath, "entity", "passport.ts"));
}

/** Данные ОДНОГО компонента — сырыми объектами, без нарезки под конкретный шаблон. */
async function collectPromptItem(entry) {
  const [{ passport }, { editorInfo }] = await Promise.all([
    importModule(join(entry.path, "entity", "passport.ts")),
    importModule(join(entry.path, "playground", "index.ts")),
  ]);

  const title = entry.name
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

  const sourcePath = join(entry.path, "components", "kit.tsx");

  return {
    name: entry.name,
    title,
    kitContext,
    passportJson: JSON.stringify(passport, null, 2),
    editorInfoJson: JSON.stringify(editorInfo, null, 2),
    componentSource: existsSync(sourcePath) ? readFileSync(sourcePath, "utf8") : undefined,
  };
}

mkdirSync(outDir, { recursive: true });

const entries = discoverEntries(srcDir, { isEntry: isComponentEntry });

const files = await generateScaffoldFiles(entries, {
  outputPathFor: (entry) => join(outDir, `${entry.name}.md`),
  collect: collectPromptItem,
  render: fromEntryTemplate(join(thisDir, "templates", "component-prompt.md.hbs")),
});

writeGeneratedFiles(files);

// Тот же довод, что у `../readme/readme.mjs`'s предупреждения: сообщение печатается там, где
// агент реально смотрит в момент "готово", а не только в README, который он мог уже пролистать.
console.log(`prompt: собрано ${files.length} промпт-файлов в generators/prompt/out/.`);
console.log("Это НЕ документация — это СЫРЬЁ для неё. Следующий шаг делает не этот скрипт, а ты:");
console.log("открой out/<имя>.md нужного компонента, следуй инструкции внутри (раздел Task) и допиши прозу в src/<имя>/README.md, секция ## Notes.");
