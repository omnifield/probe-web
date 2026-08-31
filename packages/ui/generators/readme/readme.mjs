// АВТО-README КОМПОНЕНТА (PWEB-205/GEN-5, 2026-08-30, зоны — 2026-08-31) — anatomy/settings/
// значения, вытащенные из реального паспорта (`entity/passport.ts`) И редакторского среза
// (`playground/index.ts`), не переписанные руками.
//
// ПЯТЬ ЗОН, НЕ ОДИН КУСОК (постановка user, 2026-08-31: «должно быть не просто кучей, а по своим
// разделам с нормальным описанием»). Каждый источник данных компонента — паспорт, io-схема, реальные
// компоненты, сборки, proof-рецепт — получает свой заголовок, свою мех. таблицу и СВОЙ маркерный
// блок (`<!-- user:<zone>:start/end -->`), а не один общий «## Notes» на всё разом. `mergeMarkedRegions`
// (`@probe-web/generators/preserve`) уже поддерживает это — по одному вызову на пару маркеров
// (см. её же README), никакого нового движка заводить не пришлось.
//
// ДВА ИСТОЧНИКА ДАННЫХ у самого паспорта, не один: `entity/passport.ts` — РАНТАЙМ
// (части/состояния/`mark`/настройки со значением по умолчанию), `playground/index.ts` —
// РЕДАКТОРСКИЙ срез (`means` — человеком написанный смысл каждой части/состояния/настройки, плюс
// group/genus/footprint/assemblies). Тот же довод, что у самого паспорта (`PWEB-115`/`PWEB-118`).
//
// `means` может быть плейсхолдером `"TODO"` — так заведено по конвенции playground (заполняет
// другой агент), и это честный, не выдуманный текст: показываем как есть, не подменяем.
//
// Данные читаются ИСПОЛНЕНИЕМ файла (`@probe-web/generators/extract`, движок — `vite`), не
// разбором текста — та же причина, что и раньше.
//
// ЗАПИСЬ ОДНОГО КОМПОНЕНТА (`ONLY=<имя> pnpm run readme`) — пилот сейчас доводится ТОЛЬКО на
// аккордеоне (постановка user), остальные 30 компонентов не должны молча перезаписаться на
// половину структуры, пока форма зон не устоялась. Без `ONLY` — обычный полный прогон по всем.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { discoverEntries, fromEntryTemplate, writeGeneratedFiles } from "@probe-web/generators/barrel";
import { importModule } from "@probe-web/generators/extract";
import { mergeMarkedRegions } from "@probe-web/generators/preserve";
import { generateScaffoldFiles } from "@probe-web/generators/scaffold";
import solid from "vite-plugin-solid";

const thisDir = dirname(fileURLToPath(import.meta.url));
const srcDir = join(resolve(thisDir, "..", ".."), "src");

// Оба каталога — по заявке, закрытой в движке (`products/generators`'s `importModule` теперь
// принимает второй аргумент, `PWEB-58`): `@omnifield/probe-web-io` транзитивно тянет
// `fast-json-patch` (CJS без `exports`-карты) — нужен `ssr.noExternal`; `components/kit.tsx`
// несёт настоящий Solid JSX — нужен сам JSX-пресет.
const IO_CONFIG = { ssr: { noExternal: ["fast-json-patch"] } };
const KIT_CONFIG = { plugins: [solid()] };

const { z } = await importModule("@omnifield/probe-web-io", IO_CONFIG);

/** Одна зона = один самостоятельный маркерный блок (`mergeMarkedRegions` берёт ровно одну пару за вызов). */
const ZONES = ["passport", "io", "components", "assemblies", "recipe", "notes"];

function markersFor(zone) {
  // "notes" остаётся БЕЗ имени зоны в самом маркере — старый формат (`<!-- user:start -->`),
  // тот же, что уже вычитан живыми компонентами (accordion/select/button/listbox) и на который
  // нацелен `prompt.mjs`'s шаблон. Переименовать его значило бы молча потерять уже написанную
  // прозу у всех четырёх при первом же прогоне.
  if (zone === "notes") return { start: "<!-- user:start -->", end: "<!-- user:end -->" };
  return { start: `<!-- user:${zone}:start -->`, end: `<!-- user:${zone}:end -->` };
}

/** `{kind:"attribute", name, value?}` → `[name="value"]`/`[name]`; `{kind:"pseudo", name}` → `name` (уже несёт `:`). */
function formatMark(mark) {
  if (!mark) return "—";
  if (mark.kind === "pseudo") return mark.name;
  return mark.value === undefined ? `[${mark.name}]` : `[${mark.name}="${mark.value}"]`;
}

function isComponentEntry(entryPath, name) {
  if (process.env.ONLY && name !== process.env.ONLY) return false;
  return existsSync(join(entryPath, "entity", "passport.ts"));
}

/** Одна строка дерева сборки — узел-компонент или узел-содержимое, с чем он связан данными. */
function outlineLines(node, depth) {
  const indent = "  ".repeat(depth);
  if ("genus" in node) {
    const value = typeof node.value === "string" ? JSON.stringify(node.value) : `{${node.value.path}}`;
    return [`${indent}${node.genus}: ${value}`];
  }

  const bits = [node.node];
  if (node.repeat) bits.push(`repeat: ${node.repeat.path}`);
  if (node.bind) bits.push(`bind: ${Object.keys(node.bind).join(", ")}`);
  if (node.on) bits.push(`on: ${Object.keys(node.on).join(", ")}`);

  const lines = [`${indent}${bits.join(" · ")}`];
  for (const child of node.children ?? []) lines.push(...outlineLines(child, depth + 1));
  return lines;
}

/** Собирает данные одного README из реального паспорта + редакторского среза + io + компонентов + рецепта. */
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

  // Data contract (`entity/io.ts`) — необязателен, не у каждого компонента сегодня есть.
  const ioPath = join(entry.path, "entity", "io.ts");
  let inputSchemaJson;
  let outputSchemaJson;
  if (existsSync(ioPath)) {
    const io = await importModule(ioPath, IO_CONFIG);
    if (io.input) inputSchemaJson = JSON.stringify(z.toJSONSchema(io.input), null, 2);
    if (io.output) outputSchemaJson = JSON.stringify(z.toJSONSchema(io.output), null, 2);
  }

  // Real Solid implementations (`components/kit.tsx`) — часть → чем реально рисуется, по имени
  // функции. `kit.parts` — та же карта, что `defineKitComponent` (`kit-form.ts`) уже проверила
  // на старте (каждая часть паспорта названа, ничего лишнего) — не второй источник правды.
  const kitPath = join(entry.path, "components", "kit.tsx");
  let componentRows;
  if (existsSync(kitPath)) {
    const { kit } = await importModule(kitPath, KIT_CONFIG);
    componentRows = Object.entries(kit.parts).map(([part, Component]) => ({
      part,
      component: Component.name || "—",
    }));
  }

  // Assemblies (`editorInfo.assemblies` — уже собраны выше, независимо от того, файл это или папка).
  const assemblyRows = (editorInfo.assemblies ?? []).map((assembly) => ({
    name: assembly.name,
    means: assembly.means,
    outline: outlineLines(assembly.tree, 0).join("\n"),
  }));

  // Proof-рецепт (`playground/recipe.ts`) — НИКОГДА не поставка, см. кита README «Какой скин настоящий».
  // `SlotRecipe` (`packages/skin/src/recipe/slot.ts`) несёт ДВЕ независимые оси условности —
  // именованные `variants` (переключаются `data-variant`) и `settings` (переключаются самим
  // паспортом компонента, например `orientation`) — не у каждого рецепта заняты обе.
  const recipePath = join(entry.path, "playground", "recipe.ts");
  let recipeVariants;
  let recipeDefault;
  let recipeSettingRows;
  if (existsSync(recipePath)) {
    const { recipe } = await importModule(recipePath);
    recipeVariants = Object.keys(recipe.variants ?? {});
    recipeDefault = recipe.defaultVariant;
    recipeSettingRows = Object.entries(recipe.settings ?? {}).map(([setting, conditions]) => ({
      setting,
      conditions: Object.keys(conditions).join(", "),
    }));
  }

  return {
    title,
    group: editorInfo.group ?? "—",
    genus: editorInfo.genus ?? "—",
    footprint: editorInfo.footprint ?? "—",
    partMeanings,
    stateRows,
    settingRows,
    variableRows,
    hasIo: inputSchemaJson !== undefined || outputSchemaJson !== undefined,
    inputSchemaJson,
    outputSchemaJson,
    componentRows,
    assemblyRows,
    hasRecipe: existsSync(recipePath),
    recipeVariants,
    recipeSettingRows,
    recipeDefault,
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
// решать за движок»). По ОДНОМУ вызову на зону (движок поддерживает ровно одну пару маркеров за
// раз, см. его же README) — файл, у которого зоны ещё нет (первая генерация или старый формат без
// неё), просто ничего не теряет: `mergeMarkedRegions` возвращает свежий текст как есть.
const mergedFiles = freshFiles.map((file) => {
  const existingContent = existsSync(file.path) ? readFileSync(file.path, "utf8") : undefined;
  const content = ZONES.reduce((acc, zone) => mergeMarkedRegions(acc, existingContent, markersFor(zone)), file.content);
  return { path: file.path, content };
});

writeGeneratedFiles(mergedFiles);

// ПРЕДУПРЕЖДЕНИЕ В ТЕРМИНАЛ, НЕ ТОЛЬКО В ДОКУ (2026-08-30, PWEB-210 follow-up): живой тест
// показал, что агент, зашедший в generators/ и прогнавший ЭТУ команду, читает вывод команды и по
// нему заявляет задачу выполненной — README-файлы обновлены, ошибок нет. Предупреждение, лежащее
// только в generators/README.md, до этого момента решения не долетает.
console.log(`readme: обновлено ${mergedFiles.length} README.md${process.env.ONLY ? ` (ONLY=${process.env.ONLY})` : ""}.`);
console.log("Механика — таблицы + краткое описание зоны. Проза (Overview/Features/Examples/Accessibility) — отдельный шаг: pnpm run prompt.");
