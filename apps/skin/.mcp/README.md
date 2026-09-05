# Зона `skin-mcp` — MCP-сервер для создания скина

Ручки на уже готовую механику `packages/skin`, не новая механика. Заявка, из которой собран этот
список (Windshift, workspace SKINED), и проверка её пункт за пунктом против кода — в истории
разговора, не здесь; повторять её не будем.

**v1 — только текст.** CSS-текст (`generateSkinCss`) и структурированные отчёты проверок
(`checkOutfit`/`checkSkin`/`checkAssembly`/`skinGaps`), без скриншота. Живого рендера в headless-
браузере в репозитории сегодня нет нигде (`playwright` не установлен, `tools/live-check` из
старого чекпойнта — путь, которого в дереве больше нет) — это отдельная задача второй волны, не
часть этого сервера.

**Регистрация тулов и транспорт — через `@web-core/mcp`.** Зона больше не зовёт SDK
(`@modelcontextprotocol/sdk`) напрямую — общий тулинг закрывает то, чего не хватало живому аудиту
этой зоны: annotations на каждом туле (раньше не было вовсе), настоящий `isError` по спеке (раньше
даже настоящие отказы уезжали `isError:false`), пагинацию `list_presets`, бутстрап транспорта
(stdio/Streamable HTTP одним конфигом, без переписывания). Разбор устройства и решений самого
тулинга — `packages/mcp/README.md`/`FAQ.md`, здесь не повторяется.

## Устройство

| файл | что делает |
|---|---|
| `src/kit.ts` | реестр кита — `passportOf`/`editorInfoOf`/`ioOf` уже собраны барреллом (`packages/ui/src/passport.ts`, `.../io.ts`), здесь только форма ответа под MCP; плюс `exampleDataFor` — пример по io-схеме через `packages/io`'s `exampleOf`, для проверки данных сборки |
| `src/mechanics.ts` | связка с источником паспортов, один раз (`withPassports`, `PWEB-94`) — `checkOutfit`/`assemble`/`checkSkin`/`generateSkinCss`, плюс двухпроходная проверка сборки: `checkAssembly` (структура) и `checkAssemblyData` (`bind`/`repeat.path` против примера) — обе выведены наружу из `@web-core/skin/editor`, раньше были заперты внутри `defineEditorInfo` |
| `src/store.ts` | разговор со службой пресетов (`8787`) — Node-версия клиента `apps/skin/src/entities/outfit/api/store.ts`, тот читает адрес из `import.meta.env`, здесь `process.env` |
| `src/validate.ts` | проверка ОДИНОЧНОЙ палитры/формы — своей функции у механики для этого нет, здесь синтетический наряд из одной записи (см. комментарий в файле) |
| `src/tools.ts` | регистрация десяти ручек через `@web-core/mcp` (`registerTool`/`ok`/`err`) |
| `src/server.ts` | точка входа — бутстрап транспорта через `@web-core/mcp/transport` |

## Ручки

`list_components` · `get_passport` · `list_presets` · `get_preset` · `check_palette` ·
`check_form` · `check_assembly` · `check_outfit` · `assemble_preview` · `save_preset`.

Входы палитры/формы/наряда/сборки приходят СВОБОДНОЙ формой (`z.looseObject`) — содержимое
проверяет механика, а не граница протокола: второй, более узкий контракт здесь молча разошёлся бы
с настоящим (тот же довод, что у `backend/presets`, которая тоже не толкует содержимое).

Каждая ручка размечена `access` (`read`/`write`) через `@web-core/mcp` — отображается в нативные
`readOnlyHint`/`destructiveHint` спеки MCP; только `save_preset` — `write`, остальные девять —
`read`. Отказ протокола (`isError: true`) — только для не найденного по имени/сломанного входа
(`get_passport`/`get_preset` с неизвестным именем, `save_preset` с кривой формой assembly-состояния);
флав-отчёты (`check_*`, отказ валидации внутри `save_preset`, `OutfitRefused` внутри
`assemble_preview`) — обычные business-данные тула (`isError: false`), а не отказ протокола: тул
СДЕЛАЛ, что просили (проверил), просто результат проверки отрицательный. `list_presets` с
указанным `kind` отдаёт страницу (`cursor`/`limit`, курсорная пагинация из `@web-core/mcp/pagination`),
без `kind` — всё как раньше, без пагинации (видов всего четыре).

## Запуск

```sh
pnpm --filter @web-core/skin-mcp start   # stdio-сервер (по умолчанию)
pnpm --filter @web-core/skin-mcp typecheck
```

Транспорт переключается без правки кода — `SKIN_MCP_TRANSPORT=http` (плюс `PORT`, по умолчанию
`3000`) поднимает Streamable HTTP вместо stdio, через `createServer` из `@web-core/mcp/transport`.
Auth-хука сегодня нет — служба пресетов сама не проверяет ни токен, ни scope, добавлять проверку
только на этой границе было бы обманом безопасности, не защитой.

Нужна живая служба пресетов (`pnpm --filter @web-core/presets start`, порт `8787`) — без неё
ручки хранения отвечают `StoreDown`. Адрес переопределяется `SKIN_MCP_PRESETS_URL`.

## Дыра, найденная живым тестом — `checkAssembly` не читает `bind`/`props`/`on` вообще

`checkAssembly` (структура) по устройству механики никогда не смотрит на `bind`/`repeat.path` —
на уровне типов это закрывает `BoundPath` (`packages/skin/src/passport/assembly/paths.ts`), но
только пока смотрит `tsc`. Сборка, собранная агентом через MCP, приезжает JSON'ом — компилятора
над ней нет, и опечатка в пути раньше проходила как `{ok:true}` наравне с верным деревом.

Починка — `checkAssemblyData` (`packages/skin/src/passport/editor/check-assembly-data.ts`),
второй обход того же дерева: абсолютит каждый путь тем же приёмом, каким это делает рантайм при
развороте `repeat` (`scopedPath`, вынесена из `expand.ts` — один источник, не два), резолвит через
уже публичный `resolveDataBinding` и называет путь, ушедший в никуда. `check_assembly` теперь
проверяет структуру и данные разом; данные — против ПРИМЕРА по io-схеме компонента (`exampleDataFor`,
`packages/io`'s `exampleOf`), не выдуманного вручную. Компонент без `entity/io.ts` — `dataCheck:
"skipped"`, честно, а не тихий успех.

## Побочная находка — почин `packages/io`

`get_passport` тянет io-схему компонента через `@web-core/ui/io`, а та — саму
`@web-core/io`. Под настоящим (не бандлерным) Node ESM это падало:
`packages/io/src/paths.ts` брала `getValueByPointer` именованным импортом из `fast-json-patch`, а
библиотека кладёт это имя в `exports` ДИНАМИКОЙ (`Object.assign(exports, core)`) — статический
анализ Node (`cjs-module-lexer`) такое не видит, и именованный импорт падает
`ERR_MODULE_NOT_FOUND`. Под Vite/Vitest это не проявлялось — там интероп терпимее, поэтому не
было замечено раньше. Почин — дефолтный импорт вместо именованного (`packages/io/src/paths.ts`),
дефолтный экспорт `module.exports` целиком работает у Node ESM всегда, независимо от статического
анализа. Тот же паттерн (тот же лоуд) остаётся у `packages/assembly/src/tree.ts` — не тронуто,
эта зона в графе зависимостей `skin-mcp` не стоит.
