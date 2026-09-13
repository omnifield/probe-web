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

⚙️ Два раннера под одну идею («вход + шаблон → нужный нам выход»), для двух непохожих сред, плюс
browser-safe механика без раннера вообще (схема → поля, значение по пути, болван нового элемента
списка).
`engine` — раннер вида `vite`/`webpack`, используйте, если зона репозитория штампует файлы шаблоном
(агрегат из папок компонентов, файл на каждую папку) и хочет сохранять ручные правки поверх
регенерации, вместо своего скрипта на голом `node:fs`. Раннер сканирует папки, гоняет ВСЕ плагины
из конфига (fan-out: собрать данные → отрендерить → записать), сам сливает размеченные зоны с тем,
что человек дописал руками — плагин ни разу не трогает диск сам. 🖥️ CLI (`web-core-generate`)
грузит TS-конфиг ИСПОЛНЕНИЕМ (не разбором текста) и гоняет раннер — потребителю не нужно писать ни
строчки обвязки (`fileURLToPath`/`dirname`/`await run(...)`). Первый и пока единственный настоящий
потребитель — `packages/ui`: `generators/generate.config.ts` → `kitBarrelPlugins` →
`passport.ts`/`kit.ts`/`io.ts`/`index.ts` кита. `mapping` — раннер под браузер: без `node:fs`/Vite,
источник — один сырой текст (не скан папок), выход — типизированные данные в памяти (не файл),
логика — dispatch (выбрать РОВНО ОДИН подошедший шаблон по guard'у, не прогнать все). Настоящий
потребитель — `apps/skin`: юзер грузит файл спеки (OpenAPI/Swagger) через `<input type=file>`,
шаблон под конкретный диалект спеки превращает его в `Endpoint[]`/`Service`. `fields` — не раннер, а
тройка чистых функций под одну механику: io-схема (`z.ZodType`, ЛЮБАЯ — не только компонента, тот же
вызов подходит и под схему одной ручки `Endpoint`) → плоский список полей для формы редактирования
(`fieldsOf`/`fieldsOfElement`, массив объектов — отдельным `kind: "list"` с элементом для рекурсии);
чтение и иммутабельная запись значения по тому же пути (`valueAt`/`withValue`); болван нового
элемента списка по умолчанию для его типа (`blankElement`). Потребитель — `apps/skin`: и виджет
настроек компонента, и панель ручек OpenAPI строят форму по одному и тому же списку полей, без
собственного обхода схемы или ручной записи по пути.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-узлов — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор
(или имя бинарника), которым эта часть достаётся.

| Часть                                                        | Адрес                              | Экспортирует                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Раннер и API плагина                                         | `@web-core/generators/engine`      | `defineConfig`, `run`, `hasFile`, `EntryContext`, `toEntryContext`, `AggregatePlugin`, `PerEntryPlugin`, `GeneratorPlugin`, `isAggregatePlugin`, `discoverEntries`, `writeGeneratedFiles`, `fromTemplate`, `fromEntryTemplate`, `identifierFromEntryName`, `Entry`, `GeneratedFile` |
| Dispatch-раннер под сырой текст, браузер-безопасный          | `@web-core/generators/mapping`     | `run`, `MappingTemplate`                                                                                                                                                                                                                                                            |
| io-схема → поля формы + значение по пути, браузер-безопасный | `@web-core/generators/fields`      | `fieldsOf`, `fieldsOfElement`, `blankElement`, `valueAt`, `withValue`, `FieldDescriptor`, `FieldKind`, `FieldPath`, `ListElementSchema`                                                                                                                                             |
| Чтение TS-модуля исполнением                                 | `@web-core/generators/extract`     | `importModule`                                                                                                                                                                                                                                                                      |
| Сохранение ручных правок                                     | `@web-core/generators/preserve`    | `mergeMarkedRegions`, `MarkedRegionMarkers`, `extractMarkedRegion`                                                                                                                                                                                                                  |
| Готовый плагин под «кит»-раскладку                           | `@web-core/generators/plugins/kit` | `kitBarrelPlugins`, `KitBarrelOptions`                                                                                                                                                                                                                                              |
| Точка входа                                                  | бинарник `web-core-generate`       | CLI (`web-core-generate <config.ts>`); `runCli` — та же загрузка программным вызовом                                                                                                                                                                                                |

📂 Внутри `@web-core/generators`: `src/engine/` расколот по концерну, не по подпутю — `runner.ts`
(сам раннер: `defineConfig`/`run`), `context.ts` (`EntryContext` — фильтр/чтение/импорт без
`node:fs` в руках плагина), `types.ts` (`AggregatePlugin`/`PerEntryPlugin`/`Entry`/
`GeneratedFile`), `scan.ts`/`write.ts` (скан папок / запись на диск), `template.ts`
(Handlebars-обёртка), `identifier.ts` (`kebab-case` → `camelCase`), `predicates.ts` (`hasFile`).
`src/extract/module.ts` и `src/preserve/regions.ts` — однофайловые, `src/plugins/kit/barrels.ts` —
единственный сегодня готовый плагин, `src/cli.ts` — точка входа без папки, как и `bin.mjs` у
`build`. `src/mapping/` — отдельный раннер (`types.ts`+`runner.ts`), без `node:fs`/Vite вообще, под
один сырой текст на входе (пример потребителя — `apps/skin`, файл спеки через `<input
type=file>`), не под скан папок — см. FAQ.md, почему это не тот же `run()`, что у `engine`.
`src/fields/` — `types.ts` (`FieldDescriptor`/`FieldKind`/`FieldPath`/`ListElementSchema`, плюс
внутренние `JsonProp`/`JsonRoot` — форма `z.toJSONSchema`, не экспортируются из `index.ts`),
`walker.ts` (`resolve`/`leafKind`/`fieldsOfNode`/`blankValue` — внутренние, `fieldsOf`/
`fieldsOfElement`/`blankElement` — публичные, все ходят по одному и тому же внутреннему дереву) и
`value.ts` (`valueAt`/`withValue` — не ходят по дереву схемы вообще, только по `FieldPath` и
реальным данным, поэтому не в `walker.ts`). Никакого раннера — вызывающему нужен ровно один вызов
на одну схему/один путь.

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
  plugins: kitBarrelPlugins({
    outputDir: srcDir,
    templatesDir: join(thisDir, "templates", "barrel"),
  }),
});
```

```
web-core-generate generators/generate.config.ts
```

**Свой плагин** (не «кит»-раскладка) — просто объект нужной формы, `AggregatePlugin` (один файл
из всех entries) или `PerEntryPlugin` (файл на каждый entry):

```ts
import {
  defineConfig,
  hasFile,
  fromTemplate,
} from "@web-core/generators/engine";
import type { AggregatePlugin } from "@web-core/generators/engine";

const listPlugin: AggregatePlugin<{ name: string }> = {
  name: "index",
  output: join(srcDir, "index.ts"),
  collect: (entries) => entries.map((entry) => ({ name: entry.name })),
  render: fromTemplate(join(templatesDir, "index.ts.hbs")),
};

export default defineConfig({
  rootDir: srcDir,
  isEntry: hasFile("marker.txt"),
  plugins: [listPlugin],
});
```

**Чтение реального модуля** (не текста файла):

```ts
import { importModule } from "@web-core/generators/extract";

const { passport } = await importModule<typeof import("./entity/passport.js")>(
  "/abs/path/entity/passport.ts",
);
```

**Ручная зона, переживающая регенерацию** — не отдельный вызов, поле плагина:

```ts
{
  // ...
  zones: ["notes"], // <!-- gen:notes:start/end --> в шаблоне — раннер сам сольёт при перезаписи
}
```

**Маппинг одного сырого текста** (браузер, без `node:fs`/Vite) — один или несколько
`MappingTemplate`, `run` сам находит первый, чей `isEntry` сказал true, и падает явно, если ни
один не подошёл:

```ts
import { run } from "@web-core/generators/mapping";
import type { MappingTemplate } from "@web-core/generators/mapping";

const swagger2: MappingTemplate<RawOperation, Endpoint[]> = {
  name: "swagger-2.0",
  isEntry: (raw) => JSON.parse(raw).swagger?.startsWith("2."),
  collect: (raw) => /* paths → RawOperation[] */,
  render: (items) => /* RawOperation[] → Endpoint[] */,
};

const endpoints = await run(rawSpecText, [swagger2]);
```

**Поля формы из io-схемы** — один вызов, без раннера и без шаблонов; массив объектов приходит
`kind: "list"` с `element`, который передаётся обратно в `fieldsOfElement` для рекурсии. Схема —
ЛЮБАЯ, не только у компонента: тот же вызов подходит под схему одной записи любого домена (в
`apps/skin` — и настройки компонента, и одна ручка OpenAPI):

```ts
import { fieldsOf, fieldsOfElement } from "@web-core/generators/fields";

const fields = fieldsOf(recordSchema); // z.ZodType — любая схема одной записи

for (const field of fields) {
  switch (field.kind) {
    case "string":
      /* TextInput(field.path, field.label) */ break;
    case "number":
      /* NumberInput(...) */ break;
    case "boolean":
      /* Checkbox(...) */ break;
    case "enum":
      /* Select(field.options!) */ break;
    case "list":
      /* ListField(fieldsOfElement(field.element!)) */ break;
  }
}
```

**Правка одного поля по пути** — `valueAt`/`withValue` работают с тем же `field.path`, что отдал
`fieldsOf`, `withValue` не мутирует исходные данные:

```ts
import { fieldsOf, valueAt, withValue } from "@web-core/generators/fields";

const endpointSchema = z.object({
  method: z.enum(HTTP_METHODS),
  url: z.string(),
  tag: z.string().optional(),
});
const fields = fieldsOf(endpointSchema); // [{ path: ["method"], kind: "enum", ... }, { path: ["url"], kind: "string" }, ...]

const endpoint = { method: "GET", url: "/users", tag: "users" };
const urlField = fields.find((f) => f.path.join(".") === "url")!;

valueAt(endpoint, urlField.path); // "/users"
withValue(endpoint, urlField.path, "/users/:id"); // { method: "GET", url: "/users/:id", tag: "users" }
endpoint.url; // "/users" — исходный объект как был
```

**Кнопка «Добавить» на списочном поле** — `blankElement` даёт новый элемент со значениями по
умолчанию для его типа, `withValue` кладёт его в конец списка:

```ts
import {
  blankElement,
  fieldsOf,
  valueAt,
  withValue,
} from "@web-core/generators/fields";

const treeSchema = z.object({ items: z.array(itemSchema) }); // itemSchema — value/label/children
const [itemsField] = fieldsOf(treeSchema);

const data = { items: [{ value: "a", label: "A", children: [] }] };
const items = valueAt(data, itemsField.path) as unknown[];
const withNewItem = withValue(data, itemsField.path, [
  ...items,
  blankElement(itemsField.element!),
]);
// withNewItem.items === [{ value: "a", label: "A", children: [] }, { value: "", label: "", children: [] }]
```

<h2 id="настройки">🎚️ Настройки</h2>

🔧 У раннера нет одной сущности с общим списком настроек — конфиг раннера, плагин и готовый
`kitBarrelPlugins` настраиваются каждый своим набором полей.

| Настройка                    | Где                                    | Тип                                 | По умолчанию                                             |
| ---------------------------- | -------------------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `rootDir`                    | `defineConfig`, `config.rootDir`       | `string`                            | обязательное                                             |
| `isEntry`                    | `defineConfig`, `config.isEntry`       | `(entryPath, entryName) => boolean` | обязательное                                             |
| `plugins`                    | `defineConfig`, `config.plugins`       | `GeneratorPlugin[]`                 | обязательное                                             |
| `isEntry` (плагина)          | `AggregatePlugin`/`PerEntryPlugin`     | `(entry: EntryContext) => boolean`  | не задан — видит все entries                             |
| `setup`                      | `AggregatePlugin`/`PerEntryPlugin`     | `() => void \| Promise<void>`       | не задан                                                 |
| `zones`                      | `AggregatePlugin`/`PerEntryPlugin`     | `readonly string[]`                 | не задан — регенерация без сохранения                    |
| `outputDir`, `templatesDir`  | `kitBarrelPlugins`, `KitBarrelOptions` | `string`                            | обязательные                                             |
| Второй аргумент              | `importModule(path, config?)`          | `InlineConfig` (Vite)               | `{}`                                                     |
| `isEntry` (шаблона mapping)  | `MappingTemplate.isEntry`              | `(raw: string) => boolean`          | обязательное — guard диалекта, не фильтр по всем entries |
| `validate` (шаблона mapping) | `MappingTemplate.validate`             | `(items) => void \| Promise<void>`  | не задан                                                 |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Настоящих runtime-состояний нет — есть режимы, в которых по-разному ведёт себя раннер и его
плагины на каждом прогоне.

| Состояние                                                                 | Метка                                                                                                                                     | Где                                 |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Плагин пропустил entry                                                    | entry отсутствует в списке, переданном этому плагину                                                                                      | `runner.ts`, свой `isEntry` плагина |
| Зоне нечего сохранять (первый прогон или маркер не найден)                | остаётся плейсхолдер свежего рендера                                                                                                      | `mergeZones` → `preserve`           |
| Зона донесла ручную правку                                                | кусок из старого файла на диске вставлен в свежий рендер                                                                                  | `mergeZones`                        |
| Прогон прерван, ничего не записано                                        | исключение из `collect`/`validate` до единой записи всех файлов                                                                           | `run()`                             |
| Карта частей кита — `.tsx` или `.ts`                                      | читается с диска, не выбирается заранее                                                                                                   | `kitBarrelPlugins`, `kitFileOf`     |
| `io.ts` пуст, но существует                                               | ни один entry не объявил `entity/io.ts`                                                                                                   | `kitBarrelPlugins`, `ioPlugin`      |
| Ни один шаблон mapping не подошёл                                         | explicit throw с именами всех проверенных шаблонов                                                                                        | `mapping/runner.ts`                 |
| Шаблон mapping подошёл                                                    | только его `collect`/`validate`/`render` вызваны — остальные шаблоны не тронуты (dispatch, не fan-out)                                    | `mapping/runner.ts`                 |
| Схема не представима целиком (`z.custom`/циклический `$ref` мимо `$defs`) | `fieldsOf` отдаёт `[]`, не бросает                                                                                                        | `fields/walker.ts`                  |
| Поле — массив примитивов, не объектов                                     | не рендерится ни скаляром, ни `list` — редактировать нечего типовым контролом                                                             | `fields/walker.ts`                  |
| Поле — массив объектов                                                    | `kind: "list"`, элемент несёт свой узел для `fieldsOfElement`, глубина рекурсии не ограничена (самоссылающийся элемент снова даёт `list`) | `fields/walker.ts`                  |
| Путь `valueAt`/`withValue` мимо данных                                    | `valueAt` → `undefined`; `withValue` достраивает недостающий вложенный узел, не бросает                                                   | `fields/value.ts`                   |
| `blankElement` на enum-поле                                               | первый вариант `options`, не `undefined` и не пустая строка                                                                               | `fields/walker.ts`                  |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Вызов                                               | Принимает                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `defineConfig(config)`                              | `GeneratorConfig` (`rootDir`, `isEntry`, `plugins`)                                  |
| `run(config)`                                       | результат `defineConfig`                                                             |
| `runCli(configPath)` / `web-core-generate <config>` | абсолютный или относительный путь к `.ts`-файлу с `export default defineConfig(...)` |
| `importModule(path, config?)`                       | абсолютный путь к `.ts`-модулю, необязательный `InlineConfig`                        |
| `mergeMarkedRegions(fresh, existing, markers)`      | свежий текст, текущий текст файла (или `undefined`), пара маркеров                   |
| `kitBarrelPlugins(options)`                         | `KitBarrelOptions` (`outputDir`, `templatesDir`)                                     |
| `run(raw, templates)` (`mapping`)                   | сырой текст (`string`) + `readonly MappingTemplate[]`                                |
| `fieldsOf(schema)`                                  | `z.ZodType` (io-схема одной записи, любого домена)                                   |
| `fieldsOfElement(element)`                          | `ListElementSchema` из `FieldDescriptor.element`                                     |
| `blankElement(element)`                             | `ListElementSchema` из `FieldDescriptor.element`                                     |
| `valueAt(data, path)`                               | `unknown` + `FieldPath` из `FieldDescriptor.path`                                    |
| `withValue(data, path, value)`                      | `unknown` + `FieldPath` + новое значение листа                                       |

<h3>📤 Выход</h3>

| Источник                       | Отдаёт                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `run` / `runCli`               | `GeneratedFile[]` (`{ path, content }`) — уже записаны на диск к моменту возврата               |
| `importModule`                 | реальный, исполненный модуль — типизируется явно вызывающим (`importModule<T>`)                 |
| `mergeMarkedRegions`           | итоговая строка — свежий текст с зонами, взятыми из старого файла                               |
| `kitBarrelPlugins`             | `readonly AggregatePlugin[]` — четыре плагина, один общий скан                                  |
| `run` (`mapping`)              | `TOutput` того шаблона, что подошёл — типизированные данные, не файл                            |
| `fieldsOf` / `fieldsOfElement` | `readonly FieldDescriptor[]` — путь, лейбл, тип, опции (только `enum`), элемент (только `list`) |
| `blankElement`                 | новый элемент списка со значениями по умолчанию по типу                                         |
| `valueAt`                      | значение листа по пути, `undefined` если путь мимо                                              |
| `withValue`                    | новый объект (тот же `data` не мутирован) со значением по пути                                  |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Показаны только прогоны, реально проверенные тестом или настоящим потребителем — не
теоретические примеры.

| Сборка                                             | Что доказывает                                                                                                                                                                                                                          | Файл                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `run()` с `AggregatePlugin`                        | скан → сбор → рендер → запись одним проходом, `validate` останавливает запись целиком                                                                                                                                                   | `test/engine/runner.test.ts`                |
| `run()` с `PerEntryPlugin` + `zones`               | файл на каждый entry, ручная правка переживает повторный прогон                                                                                                                                                                         | `test/engine/runner.test.ts`                |
| `runCli`                                           | настоящий TS-конфиг грузится исполнением и гонит раннер, конфиг без `default`-экспорта — понятная ошибка                                                                                                                                | `test/cli/cli.test.ts`                      |
| `kitBarrelPlugins`                                 | `.tsx`/`.ts`-разводка карты кита, `io.ts` фильтруется по `entity/io.ts`, обе ошибки валидации не пишут ничего на диск                                                                                                                   | `test/plugins/kit/barrels.test.ts`          |
| `mapping.run`                                      | dispatch на первый подошедший шаблон, остальные не тронуты, `validate` останавливает до `render`, ни один guard не подошёл — explicit throw с именами шаблонов                                                                          | `test/mapping/runner.test.ts`               |
| `fieldsOf`/`fieldsOfElement`/`blankElement`        | скаляры/enum/вложенный объект/список объектов различаются верно, список примитивов не рендерится, самоссылающийся элемент списка рекурсирует без потери глубины, непредставимая схема отдаёт `[]`, болван нового элемента верен по типу | `test/fields/walker.test.ts`                |
| `valueAt`/`withValue`                              | чтение/запись по составному пути, путь мимо не бросает, исходные данные не мутируются                                                                                                                                                   | `test/fields/value.test.ts`                 |
| `importModule` + шаблон против настоящего паспорта | реальный `passport.ts` (копия `accordion`) исполняется и превращается в таблицы README                                                                                                                                                  | `test/engine/component-readme.test.ts`      |
| Настоящий потребитель                              | `packages/ui` — `generate.config.ts` порождает `passport.ts`/`kit.ts`/`io.ts`/`index.ts`, кит целиком собирается и типчекается на результате                                                                                            | `packages/ui/generators/generate.config.ts` |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Съёмный слой этого движка — сам плагин: раннер не носит в себе ни одного вида генерации
заранее, любой `AggregatePlugin`/`PerEntryPlugin` подключается явным элементом массива `plugins`,
без него раннер ничего не производит вовсе.

```ts
import {
  defineConfig,
  hasFile,
  fromEntryTemplate,
} from "@web-core/generators/engine";
import type { PerEntryPlugin } from "@web-core/generators/engine";

const readmePlugin: PerEntryPlugin<{ name: string }> = {
  name: "readme",
  outputFor: (entry) => entry.resolve("README.md"),
  collect: (entry) => ({ name: entry.name }),
  render: fromEntryTemplate(join(templatesDir, "readme.md.hbs")),
  zones: ["notes"],
};

export default defineConfig({
  rootDir: srcDir,
  isEntry: hasFile("entity/passport.ts"),
  plugins: [readmePlugin],
});
```

✨ `kitBarrelPlugins` — готовый рецепт именно под «кит»-раскладку; свою — как выше, руками, теми
же двумя формами, что и он.
