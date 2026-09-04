# 🏭 web-core generators

🏷️ codegen · 🧬 engine · 📦 `@web-core/generators`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

⚙️ Раннер вида `vite`/`webpack` — используйте, если зона репозитория штампует файлы шаблоном
(агрегат из папок компонентов, файл на каждую папку) и хочет сохранять ручные правки поверх
регенерации, вместо своего скрипта на голом `node:fs`. Раннер сканирует папки, гоняет плагины
(собрать данные → отрендерить → записать), сам сливает размеченные зоны с тем, что человек дописал
руками — плагин ни разу не трогает диск сам. 🖥️ CLI (`web-core-generate`) грузит TS-конфиг
ИСПОЛНЕНИЕМ (не разбором текста) и гоняет раннер — потребителю не нужно писать ни строчки обвязки
(`fileURLToPath`/`dirname`/`await run(...)`). Первый и пока единственный настоящий потребитель —
`packages/ui`: `generators/generate.config.ts` → `kitBarrelPlugins` → `passport.ts`/`kit.ts`/
`io.ts`/`index.ts` кита.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-узлов — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор
(или имя бинарника), которым эта часть достаётся.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Раннер и API плагина | `@web-core/generators/engine` | `defineConfig`, `run`, `hasFile`, `EntryContext`, `toEntryContext`, `AggregatePlugin`, `PerEntryPlugin`, `GeneratorPlugin`, `isAggregatePlugin`, `discoverEntries`, `writeGeneratedFiles`, `fromTemplate`, `fromEntryTemplate`, `identifierFromEntryName`, `Entry`, `GeneratedFile` |
| Чтение TS-модуля исполнением | `@web-core/generators/extract` | `importModule` |
| Сохранение ручных правок | `@web-core/generators/preserve` | `mergeMarkedRegions`, `MarkedRegionMarkers`, `extractMarkedRegion` |
| Готовый плагин под «кит»-раскладку | `@web-core/generators/plugins/kit` | `kitBarrelPlugins`, `KitBarrelOptions` |
| Точка входа | бинарник `web-core-generate` | CLI (`web-core-generate <config.ts>`); `runCli` — та же загрузка программным вызовом |

📂 Внутри `@web-core/generators`: `src/engine/` расколот по концерну, не по подпутю — `runner.ts`
(сам раннер: `defineConfig`/`run`), `context.ts` (`EntryContext` — фильтр/чтение/импорт без
`node:fs` в руках плагина), `types.ts` (`AggregatePlugin`/`PerEntryPlugin`/`Entry`/
`GeneratedFile`), `scan.ts`/`write.ts` (скан папок / запись на диск), `template.ts`
(Handlebars-обёртка), `identifier.ts` (`kebab-case` → `camelCase`), `predicates.ts` (`hasFile`).
`src/extract/module.ts` и `src/preserve/regions.ts` — однофайловые, `src/plugins/kit/barrels.ts` —
единственный сегодня готовый плагин, `src/cli.ts` — точка входа без папки, как и `bin.mjs` у
`build`.

<h2 id="использование">🚀 Использование</h2>

✅ Продукту с «кит»-раскладкой (`entity/passport.ts`+`playground/index.ts`+`components/kit.ts(x)`,
опционально `entity/io.ts`) нужен только тонкий конфиг и одна команда:

```ts
// generators/generate.config.ts
import { defineConfig, hasFile } from "@web-core/generators/engine";
import { kitBarrelPlugins } from "@web-core/generators/plugins/kit";

export default defineConfig({
  rootDir: srcDir,
  isEntry: hasFile("entity/passport.ts"),
  plugins: kitBarrelPlugins({ outputDir: srcDir, templatesDir: join(thisDir, "templates", "barrel") }),
});
```

```
web-core-generate generators/generate.config.ts
```

**Свой плагин** (не «кит»-раскладка) — просто объект нужной формы, `AggregatePlugin` (один файл
из всех entries) или `PerEntryPlugin` (файл на каждый entry):

```ts
import { defineConfig, hasFile, fromTemplate } from "@web-core/generators/engine";
import type { AggregatePlugin } from "@web-core/generators/engine";

const listPlugin: AggregatePlugin<{ name: string }> = {
  name: "index",
  output: join(srcDir, "index.ts"),
  collect: (entries) => entries.map((entry) => ({ name: entry.name })),
  render: fromTemplate(join(templatesDir, "index.ts.hbs")),
};

export default defineConfig({ rootDir: srcDir, isEntry: hasFile("marker.txt"), plugins: [listPlugin] });
```

**Чтение реального модуля** (не текста файла):

```ts
import { importModule } from "@web-core/generators/extract";

const { passport } = await importModule<typeof import("./entity/passport.js")>("/abs/path/entity/passport.ts");
```

**Ручная зона, переживающая регенерацию** — не отдельный вызов, поле плагина:

```ts
{
  // ...
  zones: ["notes"], // <!-- gen:notes:start/end --> в шаблоне — раннер сам сольёт при перезаписи
}
```

<h2 id="настройки">🎚️ Настройки</h2>

🔧 У раннера нет одной сущности с общим списком настроек — конфиг раннера, плагин и готовый
`kitBarrelPlugins` настраиваются каждый своим набором полей.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `rootDir` | `defineConfig`, `config.rootDir` | `string` | обязательное |
| `isEntry` | `defineConfig`, `config.isEntry` | `(entryPath, entryName) => boolean` | обязательное |
| `plugins` | `defineConfig`, `config.plugins` | `GeneratorPlugin[]` | обязательное |
| `isEntry` (плагина) | `AggregatePlugin`/`PerEntryPlugin` | `(entry: EntryContext) => boolean` | не задан — видит все entries |
| `setup` | `AggregatePlugin`/`PerEntryPlugin` | `() => void \| Promise<void>` | не задан |
| `zones` | `AggregatePlugin`/`PerEntryPlugin` | `readonly string[]` | не задан — регенерация без сохранения |
| `outputDir`, `templatesDir` | `kitBarrelPlugins`, `KitBarrelOptions` | `string` | обязательные |
| Второй аргумент | `importModule(path, config?)` | `InlineConfig` (Vite) | `{}` |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Настоящих runtime-состояний нет — есть режимы, в которых по-разному ведёт себя раннер и его
плагины на каждом прогоне.

| Состояние | Метка | Где |
|---|---|---|
| Плагин пропустил entry | entry отсутствует в списке, переданном этому плагину | `runner.ts`, свой `isEntry` плагина |
| Зоне нечего сохранять (первый прогон или маркер не найден) | остаётся плейсхолдер свежего рендера | `mergeZones` → `preserve` |
| Зона донесла ручную правку | кусок из старого файла на диске вставлен в свежий рендер | `mergeZones` |
| Прогон прерван, ничего не записано | исключение из `collect`/`validate` до единой записи всех файлов | `run()` |
| Карта частей кита — `.tsx` или `.ts` | читается с диска, не выбирается заранее | `kitBarrelPlugins`, `kitFileOf` |
| `io.ts` пуст, но существует | ни один entry не объявил `entity/io.ts` | `kitBarrelPlugins`, `ioPlugin` |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Вызов | Принимает |
|---|---|
| `defineConfig(config)` | `GeneratorConfig` (`rootDir`, `isEntry`, `plugins`) |
| `run(config)` | результат `defineConfig` |
| `runCli(configPath)` / `web-core-generate <config>` | абсолютный или относительный путь к `.ts`-файлу с `export default defineConfig(...)` |
| `importModule(path, config?)` | абсолютный путь к `.ts`-модулю, необязательный `InlineConfig` |
| `mergeMarkedRegions(fresh, existing, markers)` | свежий текст, текущий текст файла (или `undefined`), пара маркеров |
| `kitBarrelPlugins(options)` | `KitBarrelOptions` (`outputDir`, `templatesDir`) |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `run` / `runCli` | `GeneratedFile[]` (`{ path, content }`) — уже записаны на диск к моменту возврата |
| `importModule` | реальный, исполненный модуль — типизируется явно вызывающим (`importModule<T>`) |
| `mergeMarkedRegions` | итоговая строка — свежий текст с зонами, взятыми из старого файла |
| `kitBarrelPlugins` | `readonly AggregatePlugin[]` — четыре плагина, один общий скан |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Показаны только прогоны, реально проверенные тестом или настоящим потребителем — не
теоретические примеры.

| Сборка | Что доказывает | Файл |
|---|---|---|
| `run()` с `AggregatePlugin` | скан → сбор → рендер → запись одним проходом, `validate` останавливает запись целиком | `test/engine/runner.test.ts` |
| `run()` с `PerEntryPlugin` + `zones` | файл на каждый entry, ручная правка переживает повторный прогон | `test/engine/runner.test.ts` |
| `runCli` | настоящий TS-конфиг грузится исполнением и гонит раннер, конфиг без `default`-экспорта — понятная ошибка | `test/cli/cli.test.ts` |
| `kitBarrelPlugins` | `.tsx`/`.ts`-разводка карты кита, `io.ts` фильтруется по `entity/io.ts`, обе ошибки валидации не пишут ничего на диск | `test/plugins/kit/barrels.test.ts` |
| `importModule` + шаблон против настоящего паспорта | реальный `passport.ts` (копия `accordion`) исполняется и превращается в таблицы README | `test/engine/component-readme.test.ts` |
| Настоящий потребитель | `packages/ui` — `generate.config.ts` порождает `passport.ts`/`kit.ts`/`io.ts`/`index.ts`, кит целиком собирается и типчекается на результате | `packages/ui/generators/generate.config.ts` |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Съёмный слой этого движка — сам плагин: раннер не носит в себе ни одного вида генерации
заранее, любой `AggregatePlugin`/`PerEntryPlugin` подключается явным элементом массива `plugins`,
без него раннер ничего не производит вовсе.

```ts
import { defineConfig, hasFile, fromEntryTemplate } from "@web-core/generators/engine";
import type { PerEntryPlugin } from "@web-core/generators/engine";

const readmePlugin: PerEntryPlugin<{ name: string }> = {
  name: "readme",
  outputFor: (entry) => entry.resolve("README.md"),
  collect: (entry) => ({ name: entry.name }),
  render: fromEntryTemplate(join(templatesDir, "readme.md.hbs")),
  zones: ["notes"],
};

export default defineConfig({ rootDir: srcDir, isEntry: hasFile("entity/passport.ts"), plugins: [readmePlugin] });
```

✨ `kitBarrelPlugins` — готовый рецепт именно под «кит»-раскладку; свою — как выше, руками, теми
же двумя формами, что и он.
