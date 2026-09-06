# 🎨 web-core skin-mcp

🏷️ mcp · 🧬 service · 📦 `@web-core/skin-mcp`

## 🧭 Навигация

- ✨ [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">✨ Главное</h2>

🎨 MCP-сервер для создания скина web-core — используйте, если агенту (не человеку — для человека
есть визуальный редактор) нужно собрать/проверить/сохранить палитру, форму компонента, наряд или
сборку. Ручки на уже готовую механику `packages/skin`, не новая механика — сервер разведывает кит
(паспорта компонентов), проверяет ДО сохранения (два прохода: ссылки и адрес) и кладёт результат в
службу пресетов (`backend/presets`, Go+bbolt). **v1 — только текст**: CSS-текст (`generateSkinCss`)
и структурированные отчёты проверок, без скриншота — живого рендера в headless-браузере в
репозитории сегодня нет нигде, это отдельная задача второй волны.

🧵 Первый пилот подгруппы `mcp` внутри `genus: service` (канон подгруппы — корневой README.md,
раздел «Правила для шаблонов») — сама регистрация тулов и транспорт (stdio/Streamable HTTP) взяты
из `@web-core/mcp` целиком (устройство и решения самого тулинга — его `README.md`/`FAQ.md`, здесь
не повторяются); этот README держит только то, что специфично ИМЕННО скину — какие тулы, что
каждый принимает/отдаёт, и что уже найдено живым использованием.

<h2 id="анатомия">🧩 Анатомия</h2>

У сервера-зоны без DOM и без файловой поставки «часть» 🧩 — один тул, адресуемый по имени в
`tools/call`, а «адрес» — это имя.

| Тул | `access` | Что делает |
|---|---|---|
| `list_components` | `read` | Перечень компонентов кита с паспортом — что вообще можно одеть |
| `get_passport` | `read` | Паспорт одного компонента: части, состояния, настройки, io-схема, means |
| `list_presets` | `read` | Перечень сохранённого по виду (палитра/форма/наряд/сборка/тег), с пагинацией |
| `get_preset` | `read` | Содержимое одной сохранённой записи по имени |
| `check_palette` | `read` | Проверка палитры ДО сохранения |
| `check_form` | `read` | Проверка формы (рецепта компонента) в два прохода |
| `check_assembly` | `read` | Проверка дерева сборки: структура + данные (`bind`/`repeat.path`) |
| `check_outfit` | `read` | Проверка наряда (палитра+формы+теги) целиком |
| `assemble_preview` | `read` | Собрать наряд и увидеть CSS-текст + покрытие, без сохранения |
| `save_preset` | `write` | Сохранить палитру/форму/наряд/сборку/тег — после той же проверки, что и `check_*` |

📂 Девять `read`, один `write` (`save_preset`) — размечено через `access` `@web-core/mcp`,
отображается в нативные `readOnlyHint`/`destructiveHint` спеки MCP.

🏷️ **Теги наряда** — навигация по множеству вариантов одной сборки (для витрины и для агента,
которому иначе пришлось бы перебирать сотни нарядов вслепую), никак не влияет на механику сборки.
`Outfit.tags?: string[]` — свободные строки-слаги (тот же `^[a-z0-9][a-z0-9-]{0,31}$`, что и у
`name`/`kind` любой записи), сверяются со словарём (`kind: "tag"` — отдельный пятый вид пресета,
запись = просто имя, без списка участников: принадлежность живёт на самом наряде, не дублируется
в двух местах). Пусто или не передано — подставляется `["default"]`; неизвестный тег — флав
`unknown-tag`, той же формы, что `unknown-palette`. Наряд может состоять в нескольких тегах разом.

Устройство на каталоги — свой стиль подгруппы `mcp`: в корне `src/` только барель `index.ts`
(`export * from "./server"`, заодно и точка входа `pnpm start`), у каждого каталога своя роль и
свой `index.ts` как публичная поверхность.

| Каталог | Роль | Публичная поверхность |
|---|---|---|
| `server/` | точка входа — бутстрап транспорта через `@web-core/mcp/transport` | ничего наружу, только запускает |
| `tools/` | граница протокола — регистрация всех десяти тулов через `registerTool`/`ok`/`err` | `registerTools(server)` |
| `engine/` | связка с доменом skin — специфична ИМЕННО этой зоне, у другой MCP-зоны будет свой домен | `getPassport`/`listComponents` (кит), `skin`/`checkAssembly`/`skinGaps` (механика), `store` (клиент службы пресетов), `checkForm`/`checkPalette` (проверка одной записи) |

Внутри `engine/` — четыре файла по одному на концерн (`kit.ts` реестр паспортов кита под форму
MCP, `mechanics.ts` связка с источником паспортов, `store.ts` Node-клиент службы пресетов,
`validate.ts` проверка ОДНОЙ палитры/формы синтетическим нарядом — своей функции для этого у
механики нет) — они друг другу соседи, не публикуются напрямую, только через `engine/index.ts`.

<h2 id="использование">🚀 Использование</h2>

```sh
pnpm --filter @web-core/skin-mcp start      # stdio-сервер (по умолчанию)
pnpm --filter @web-core/skin-mcp dev        # то же, с перезапуском на правку
pnpm --filter @web-core/skin-mcp typecheck
```

Нужна живая служба пресетов (`pnpm --filter @web-core/presets start`, порт `8787` по умолчанию) —
без неё ручки хранения отвечают `StoreDown`.

**Типичный порядок вызова** (то же самое уходит агенту в `instructions` на `initialize`):
`list_components` → `get_passport` конкретного компонента → `check_palette`/`check_form`/
`check_assembly`/`check_outfit` → (если чисто) `save_preset`; `assemble_preview` — увидеть CSS без
сохранения. Отрицательный отчёт проверки — часть ответа (`isError: false`), не отказ инструмента.

<h2 id="настройки">🎚️ Настройки</h2>

🎛️ Все — переменные окружения `server/index.ts`, ничего не конфигурируется кодом зоны.

| Переменная | Значение | По умолчанию |
|---|---|---|
| `SKIN_MCP_TRANSPORT` | `"stdio" \| "http"` | `"stdio"` |
| `PORT` | порт HTTP-транспорта | `3000` |
| `SKIN_MCP_HOST` | адрес привязки HTTP (см. FAQ.md — зачем отдельно от умолчания пакета) | `"127.0.0.1"` (умолчание `@web-core/mcp`) |
| `SKIN_MCP_PRESETS_URL` | адрес службы пресетов (`engine/store.ts`) | `http://127.0.0.1:8787/api/presets` |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Состояния протокола (annotations/`isError`/сессии/auth) — общие для любой зоны на
`@web-core/mcp`, см. его README. Специфично для skin-mcp:

| Состояние | Метка | Где |
|---|---|---|
| Проверка нашла флавы | `isError: false`, флавы — часть данных ответа | `check_*`, `save_preset` при отказе валидации |
| Наряд не собрался (`OutfitRefused`) | `isError: false`, `{flaws}` в ответе | `assemble_preview` |
| `tags` не переданы/пусто | молча подставляется `["default"]` | `check_outfit`, `save_preset` |
| Тег не найден в словаре | флав `unknown-tag`, `isError: false` | `check_outfit`, `save_preset` |
| Имя компонента/пресета не найдено | `isError: true` | `get_passport`, `get_preset` |
| Форма assembly-состояния сломана | `isError: true` | `save_preset` (`kind: "assembly"`) |
| Компонент без `entity/io.ts` | `dataCheck: "skipped"`, не тихий успех | `check_assembly` |
| Служба пресетов недоступна | бросает `StoreDown`, SDK заворачивает в `isError: true` | любой тул со стораджем |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

Палитра/форма/наряд/сборка приходят СВОБОДНОЙ формой (`z.looseObject`) — содержимое проверяет
механика (`checkOutfit`/`checkSkin`/`checkAssembly`), а не граница протокола: второй, более узкий
контракт здесь молча разошёлся бы с настоящим (тот же довод, что у `backend/presets`, которая тоже
не толкует `state`).

| Тул | Принимает |
|---|---|
| `get_passport` | `{ component }` |
| `list_presets` | `{ kind?, cursor?, limit? }` |
| `get_preset` | `{ kind, name }` |
| `check_palette` | `{ palette }` — `Palette` целиком |
| `check_form` | `{ form, paletteName? }` — `Form` целиком |
| `check_assembly` | `{ component, assembly }` — `PassportAssembly` |
| `check_outfit` / `assemble_preview` | `{ outfit }` — `{ name, palette, forms[], tags? }` |
| `save_preset` | `{ kind, state, label?, paletteName? }` |

<h3>📤 Выход</h3>

| Тул | Отдаёт (успех) |
|---|---|
| `list_components` | массив `{ component, genus, group, footprint, package, parts, assemblies }` |
| `get_passport` | `{ component, passport, editor, io }` |
| `list_presets`/`get_preset` | `{ items, nextCursor? }` / конверт записи (`{id,label,...,state}`) |
| `check_*` | отчёт с флавами (форма своя у каждого — см. `packages/skin` README) |
| `assemble_preview` | `{ report, gaps, css }` |
| `save_preset` | `{ saved }` — сохранённый конверт |

<h2 id="сборки">🏗️ Сборки</h2>

✅ Проверено живьём, не только typecheck.

| Проверено | Как | Результат |
|---|---|---|
| Все десять тулов регистрируются | `registerTools(server)` на реальном `McpServer`, `client.listTools()` | 10 тулов, annotations верные (9 `readOnlyHint`, 1 нет) |
| Два клиента одновременно на реальных тулах зоны | два `StreamableHTTPClientTransport` на поднятый `createServer({registerTools})` | оба живы, `list_components` отвечает обоим |
| `instructions` доезжают | `client.getInstructions()` | совпадает с текстом порядка вызова из `server/index.ts` |
| Неизвестный компонент | `get_passport` с выдуманным именем | `isError: true` |
| Пагинация на реальном сервисе | `list_presets({kind:"palette", limit:1})` на живую службу `:8787` | `{items:[]}`/страница, не падает |
| Миграция легаси-пресетов | 25 записей (`backend/presets/data/*.json`, JS-эпоха) перенесены через `POST /api/presets` в Go+bbolt | `state`/`label` совпадают побайтово на выборке, `healthz` видит 25 |
| HTTP-транспорт наружу контейнера | `SKIN_MCP_TRANSPORT=http SKIN_MCP_HOST=0.0.0.0 PORT=3000` | реальный `initialize` с внешнего клиента, 200 |
| Тег по умолчанию | `check_outfit`/`save_preset` без `tags` на реальном словаре | флавов по тегу нет — тихо взят `["default"]` |
| Неизвестный тег | `tags: ["no-such-tag"]` | флав `unknown-tag` рядом с `unknown-palette`, обе проверки не мешают друг другу |
| Тег с кириллицей в имени | `save_preset({kind:"tag", state:{name:"статусы"}})` | служба пресетов отказывает `bad_name` — имя тега тот же slug-формат, что у `name` любой записи |

<h2 id="рецепт">🎨 Рецепт</h2>

🔌 Съёмный слой — `auth`-хук `createServer` (см. `@web-core/mcp`): сегодня не подключён — служба
пресетов сама без токена/scope, работаем внутри команды, все свои (осознанное решение, не
забытое). Когда понадобится:

```ts
const server = createServer({
  name: "web-core-skin",
  version: "0.0.0",
  transport: "http",
  auth: (req) => req.headers.authorization === `Bearer ${process.env["SKIN_MCP_TOKEN"]}`,
  registerTools,
});
```
