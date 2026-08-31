// АВТО-README КОМПОНЕНТА (PWEB-205/GEN-5, 2026-08-30) — anatomy/settings/значения, вытащенные из
// реального паспорта (`entity/passport.ts`) И редакторского среза (`playground/index.ts`), не
// переписанные руками.
//
// ДВА ИСТОЧНИКА ДАННЫХ, не один: `entity/passport.ts` — РАНТАЙМ (части/состояния/`mark`/настройки
// со значением по умолчанию), `playground/index.ts` — РЕДАКТОРСКИЙ срез (`means` — человеком
// написанный смысл каждой части/состояния/настройки, плюс group/genus/footprint). Тот же довод,
// что у самого паспорта (`PWEB-115`/`PWEB-118`) — два разных вопроса, не один срез на оба.
//
// `means` может быть плейсхолдером `"TODO"` — так заведено по конвенции playground (заполняет
// другой агент), и это честный, не выдуманный текст: показываем как есть, не подменяем.
//
// Данные читаются ИСПОЛНЕНИЕМ файла (`@probe-web/generators/extract`, движок — `vite`), не
// разбором текста — см. шапку `generate.mjs`, тот же довод.
//
// ОДНА РУЧНАЯ ЗОНА, НЕ ВСЁ ОСТАЛЬНОЕ (постановка user, 2026-08-30): секция `## Notes` между
// маркерами `<!-- user:start -->`/`<!-- user:end -->` переживает регенерацию — движок
// (`@probe-web/generators/preserve`) читает то, что человек туда написал в ПРЕДЫДУЩЕМ прогоне, и
// склеивает со свежим авто-текстом. Всё, что вне маркеров, — как и раньше, целиком заново.
//
// Один файл НА КАЖДЫЙ компонент, не агрегат — режим `scaffold`, зеркальный `barrel`
// (products/generators/src/scaffold/README.md).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverEntries, fromEntryTemplate, writeGeneratedFiles } from "@probe-web/generators/barrel";
import { importModule } from "@probe-web/generators/extract";
import { mergeMarkedRegions } from "@probe-web/generators/preserve";
import { generateScaffoldFiles } from "@probe-web/generators/scaffold";

const thisDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(resolve(thisDir, "..", ".."), "src");

const NOTES_MARKERS = { start: "<!-- user:start -->", end: "<!-- user:end -->" };

/** `{kind:"attribute", name, value?}` → `[name="value"]`/`[name]`; `{kind:"pseudo", name}` → `name` (уже несёт `:`). */
function formatMark(mark) {
  if (!mark) return "—";
  if (mark.kind === "pseudo") return mark.name;
  return mark.value === undefined ? `[${mark.name}]` : `[${mark.name}="${mark.value}"]`;
}

function isComponentEntry(entryPath) {
  return existsSync(join(entryPath, "entity", "passport.ts"));
}

/** Собирает данные одного README из реального паспорта + редакторского среза. */
async function collectReadmeItem(entry) {
  const [{ passport }, { editorInfo }] = await Promise.all([
    importModule(join(entry.path, "entity", "passport.ts")),
    importModule(join(entry.path, "playground", "index.ts")),
  ]);

  const partMeanings = passport.parts.map((part) => ({
    part: part.name,
    meaning: editorInfo.parts?.[part.name]?.means ?? "—",
  }));

  const stateRows = passport.parts.flatMap((part) => {
    if (!part.states || part.states.length === 0) {
      return [{ part: part.name, state: "—", mark: "—", meaning: "—" }];
    }
    return part.states.map((state) => ({
      part: part.name,
      state: state.name,
      mark: formatMark(state.mark) + (state.absentWhen ? " · may be absent" : ""),
      meaning: editorInfo.parts?.[part.name]?.states?.[state.name]?.means ?? "—",
    }));
  });

  const settingRows = Object.entries(passport.settings).map(([name, setting]) => ({
    setting: name,
    meaning: editorInfo.settings?.[name]?.means ?? "—",
    mark: formatMark(setting.mark),
    default: String(setting.byDefault),
    dependsOn: setting.dependsOn?.on,
  }));

  const variableRows = passport.parts.flatMap((part) =>
    (part.variables ?? []).map((variable) => ({
      part: part.name,
      variable: variable.name,
      setBy: variable.setBy,
      meaning: editorInfo.parts?.[part.name]?.variables?.[variable.name]?.means ?? "—",
    })),
  );

  const title = entry.name
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title,
    group: editorInfo.group ?? "—",
    genus: editorInfo.genus ?? "—",
    footprint: editorInfo.footprint ?? "—",
    partMeanings,
    stateRows,
    settingRows,
    variableRows,
  };
}

const entries = discoverEntries(srcDir, { isEntry: isComponentEntry });

const freshFiles = await generateScaffoldFiles(entries, {
  outputPathFor: (entry) => join(entry.path, "README.md"),
  collect: collectReadmeItem,
  render: fromEntryTemplate(join(thisDir, "templates", "component-readme.md.hbs")),
});

// Склейка — здесь, не внутри движка: чтение чужого текущего файла нужно только тем потребителям,
// у кого вообще есть ручная зона (products/generators/src/preserve/README.md, «не наше дело
// решать за движок»).
const mergedFiles = freshFiles.map((file) => ({
  path: file.path,
  content: mergeMarkedRegions(file.content, existsSync(file.path) ? readFileSync(file.path, "utf8") : undefined, NOTES_MARKERS),
}));

writeGeneratedFiles(mergedFiles);

// ПРЕДУПРЕЖДЕНИЕ В ТЕРМИНАЛ, НЕ ТОЛЬКО В ДОКУ (2026-08-30, PWEB-210 follow-up): живой тест
// показал, что агент, зашедший в generators/ и прогнавший ЭТУ команду, читает вывод команды и по
// нему заявляет задачу выполненной — README-файлы обновлены, ошибок нет. Предупреждение, лежащее
// только в generators/README.md, до этого момента решения не долетает: агент мог его прочитать
// раньше и всё равно не связать с тем, что он только что сделал. Печатаем ровно там, где агент
// смотрит в момент "готово".
console.log(`readme: обновлено ${mergedFiles.length} README.md.`);
console.log("Это ТОЛЬКО таблицы (anatomy/states/settings/CSS variables) — не полная документация.");
console.log("Проза и примеры — отдельный шаг: pnpm run prompt, затем прогнать generators/prompt/out/<имя>.md через агента-писателя (generators/prompt/README.md).");
