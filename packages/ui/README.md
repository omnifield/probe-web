# @omnifield/probe-web-ui

Компонентный кит `probe-web` — примитивы поверх [`@ark-ui/solid`](https://ark-ui.com)/
[`@zag-js`](https://zagjs.com): анатомия, состояния и адрес узла приходят готовыми от
поставщика, кит их не переизобретает. Три раздельные заботы — **вид** не в этом пакете
(`packages/skin`), **данные** не в этом пакете (`packages/io`), здесь только разметка и
контракт, по которому её можно узнать и одеть.

**Kobalte — остаток, не основа.** Кит переехал на Ark по одному компоненту (`PWEB-37`), и
переезд закончился: все 31 компонент из таблицы ниже стоят на `@zag-js`/`@ark-ui/solid`.
`@kobalte/core` остался только в пяти файлах ради одного примитива композиции —
`Polymorphic` (проп `as`, раздел «Что ещё стоит на kobalte» ниже). Если ищешь описание
`Select`/`Popover`/`DropdownMenu`/`Combobox` на kobalte — их в репозитории больше нет, это была
предыдущая версия кита.

## Компонент — это папка

Каждый из 31 компонента лежит в `src/<имя>/` одной и той же раскладкой:

```
src/accordion/
  entity/
    anatomy.ts      — части и адреса (createAnatomy), уезжает в бандл приложения
    passport.ts      — anatomy + состояния + ось вариаций + настройки (definePassport)
    io.ts             — вход/выход формы (packages/io, необязателен — не у каждого компонента есть данные)
    index.ts          — что видно снаружи папки из entity/
  components/
    kit.tsx           — настоящие Solid-компоненты + карта «часть → компонент» (defineKitComponent)
    index.ts           — тонкий фасад: export * from "./kit.jsx"
  playground/
    parts.ts           — таксономия частей для редактора (means/accepts), НЕ уезжает в бандл
    settings.ts         — проза настроек для редактора
    assemblies/          — рабочие сборки: скелет данных для RenderTree, по файлу на сборку + index.ts
    recipe.ts             — ДОКАЗАТЕЛЬСТВЕННЫЙ рецепт, см. «Какой скин настоящий» ниже
    index.ts               — defineEditorInfo(passport, {parts, settings, assemblies})
  test/
    <имя>.test.tsx          — живые пробы (рендер в JSDOM, не сверка структуры модуля)
  index.ts                   — что видно снаружи всей папки (entity + components)
  README.md                   — anatomy/states/settings человеку, авто-порождается частично
```

Граница между `entity/` и `playground/` — не оформление, а разные читатели: `entity/` идёт в
бандл приложения (компонент физически работает по этому контракту), `playground/` читает
только редактор/агент и никогда не попадает в собранное приложение (`sideEffects: false`, тот же
довод, по которому Storybook держит `argTypes` отдельно от компонента). Компонент без данных
просто не заводит `entity/io.ts` — поле необязательное.

**Playground пишется человеческой прозой по-русски** (`means`, подписи настроек, `README.md`'s
раздел «Notes») — это то, что видит редактор скина, не инженер. `entity/`, `components/`, тесты —
английский, без исключений.

## Паспорт: `@omnifield/probe-web-ui/passport`

**Паспорт — то, что компонент объявляет о себе данными**, чтобы его можно было одеть скином и
показать в редакторе. Форма паспорта не наша — она общая для любого поставщика компонентов
(`@omnifield/probe-web-skin/model`, `PWEB-110`), и `createAnatomy` берётся оттуда же реэкспортом,
а не напрямую из `@zag-js/anatomy` — иначе два npm-имени на один поток обновлялись бы независимо.

```ts
// src/button/entity/anatomy.ts
import { createAnatomy } from "@omnifield/probe-web-skin/model";

export const anatomy = createAnatomy("button").parts("root");
export const anatomyParts = anatomy.build();
```

```ts
// src/button/entity/passport.ts (сокращённо)
import { definePassport, defineSettings, type PassportState } from "@omnifield/probe-web-skin/model";
import { anatomy } from "./anatomy.js";

const disabled = { name: "disabled", mark: { kind: "attribute", name: "data-disabled" } } as const satisfies PassportState;

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [disabled] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: defineSettings<ButtonProps>()({ /* … */ }),
});
```

**Состояние — константа с `as const satisfies PassportState`, не `: PassportState`.** Явная
аннотация типом интерфейса расширяет `name: "disabled"` до `name: string` ДО того, как
`definePassport` успевает сохранить буквальный тип — а именно на буквальном имени состояния
держится редакторская проверка `StatesOf`/`PassportPartEditorInfo` (`packages/skin`). Найдено
живьём 2026-08-30 на 24 из 31 компонентов, поправлено разом.

```ts
import { admits, passportOf } from "@omnifield/probe-web-ui/passport";

const кнопка = passportOf("button");
кнопка?.anatomy.keys();                 // ["root"]
кнопка?.anatomy.build().root.attrs;     // { "data-scope": "button", "data-part": "root" }

const корень = кнопка?.parts.find((часть) => часть.name === кнопка.root);
admits(корень!, { kind: "content", genus: "text" });      // true — подпись
admits(корень!, { kind: "content", genus: "component" }); // false — кнопке внутрь не кладут компонент
```

`accepts` объявляет **род**, а не список имён (`text`/`icon`/`component`) — значок приезжает из
чужого пакета, и перечень имён отстал бы на первом же новом. Три состояния поля: не объявлено —
не запрещает ничего; пустой перечень — не пускает ничего, место занято самим компонентом;
перечень — допустимо ровно перечисленное.

### `KIT`/`kitOf`: чем рисуется каждая часть

Паспорта централизует кит (`PASSPORTS`), а карту «часть → компонент» — каждая папка сама, той же
формой (`defineKitComponent`, проверяет ключи против анатомии дважды: типом и на исполнении):

```ts
// src/button/components/kit.tsx
import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

export function Button(props: ButtonProps) { /* … */ }

export const kit = defineKitComponent(passport, { root: Button });
```

```ts
import { KIT, kitOf } from "@omnifield/probe-web-ui";

kitOf("accordion")?.parts.itemTrigger; // → компонент, которым рисуется itemTrigger
kitOf("accordion")?.passport;          // → тот же паспорт, что и в ./passport
```

Оба перечня (`PASSPORTS` в `src/passport.ts`, `KIT` в `src/kit.ts`) **порождены обходом папок**
(`generators/barrel/generate.mjs`, движок — `@probe-web/generators/barrel`) — файла, в который
дописывает строку каждый новый компонент, нет намеренно. `pnpm run generate` — отдельный шаг
графа сборки (nx), порождённые файлы лежат под `.gitignore` и не правятся руками.

## Данные компонента: `entity/io.ts`

Форма данных, которые компонент реально принимает/отдаёт — zod-схема через
`@omnifield/probe-web-io`, физически отдельная от паспорта скина: **данные не зависят от скина,
скин не зависит от данных.**

```ts
// src/listbox/entity/io.ts
import { z } from "@omnifield/probe-web-io";

const item = z.object({ value: z.string(), label: z.string() });

export const input = z.object({ label: z.string(), items: z.array(item) });
export const output = z.object({ value: z.array(z.string()) });
export type Data = z.infer<typeof input>;
```

`Data` — третий параметр `PassportAssembly<Part, Registry, Data>` (`packages/skin`): им типизируются
`bind`/`repeat.path` в `playground/assemblies/*` компилятором, не строками наугад. Поле
необязательное — заводится, когда у компонента реально есть данные, а не для каждого без
исключения.

## Playground: что видит редактор

- **`parts.ts`** — по части: `means` (человеку), `states`/`accepts` (машине и человеку разом).
  Пишется `as const`, НЕ явной аннотацией типом — та же ловушка, что у состояний паспорта, только
  на уровень выше (широкая аннотация стирает буквальные `kind: "component"` и имена состояний ещё
  до того, как `defineEditorInfo` успевает их проверить).
- **`settings.ts`** — проза настроек: `means`/`options[].means`. Тоже без широкой аннотации по
  той же причине.
- **`assemblies/`** — рабочие СКЕЛЕТЫ, не контент: только `bind`/`repeat`/`{ path }`. Хардкожить
  реальные строки, собирать детей `.map()`'ом из локального массива — запрещено; наполнение всегда
  идёт данными снаружи (`RenderTree`'s `data`, тест или продукт). Каждая сборка — свой файл,
  `assemblies/index.ts` их компонует.
- **`recipe.ts`** — см. следующий раздел, это НЕ то, что видит витрина.
- **`index.ts`** — вызывает `defineEditorInfo(passport, { parts, settings, assemblies })`; сам
  проверяет на исполнении, что редакторский срез не разошёлся с рантайм-паспортом (забытая
  часть/состояние — исключение при импорте, а не молчаливый рассинхрон).

Прозу компонентного `README.md`'s `## Notes` (между `<!-- user:start -->`/`<!-- user:end -->`,
единственный ручной блок — остальное перегенерирует `pnpm run readme` из паспорта) пишет агент по
промпту `generators/prompt/out/<имя>.md` (`pnpm run prompt`). Общий контекст кита для этого
промпта — `generators/prompt/kit-context.md`, ОДИН файл на весь кит, сейчас почти пустой
черновик: именно туда, а не только в этот README, стоит нести находки вроде трёх разделов ниже —
он попадает в промпт каждого будущего компонента напрямую.

## Сборка ссылается на чужой компонент

Составить сборку из компонентов ДРУГИХ папок — обычное дело (`action-list` у аккордеона кладёт
внутрь `itemContent` настоящий `listbox`, не свою копию), но адресация — не то, что подсказывает
интуиция:

```ts
{
  node: "listbox",              // корень чужого компонента — ГОЛОЕ имя
  bind: { items: "items" },
  children: [
    {
      node: "listbox.content",  // НЕ-корневая часть чужого компонента — ЧЕРЕЗ ТОЧКУ
      children: [
        { node: "listbox.item", repeat: { path: "items" }, bind: { item: "" }, children: [
          { node: "listbox.itemText", children: [{ genus: "text", value: { path: "label" } }] },
        ] },
      ],
    },
  ],
}
```

Почему так: `baseAssemblyOf` квалифицирует адрес (`component.part`) только для частей СВОЕЙ
анатомии; имя, которого нет в своей анатомии, идёт в реестр как есть. Голое `"content"` не
находится нигде и молча не рисуется — ни ошибки, ни детей (проверено живьём 2026-08-30: корень
рисовался, дети — нет).

**У чужого компонента нет `selfAssembly` — разворачивать нечего.** У кнопки бывает
`passport.selfAssembly`, и голая ссылка на неё раскрывается сама (клик → событие, разметка). У
большинства компонентов такого поля нет вовсе — значит всю составную структуру (`content`/
`item`/`itemText`/…) пишешь сам, копируя `playground/assemblies.ts` ЭТОГО компонента как
образец, а не изобретая с нуля.

**`on` понимает только четыре нативных DOM-события** (`click`/`change`/`input`/`submit`) и
компонует их со СВОИМ обработчиком части, а не перебивает его — проверено живьём на
`itemTrigger` (одновременно раскрывается сам через Ark и шлёт своё `triggerClick`) и повторно на
`listbox.item` (выбор пункта работает, `on.click` тоже срабатывает). Для событий вроде
`onValueChange`, которых нет в этой четвёрке, — сборка их не видит вообще.

## Какой скин настоящий

**`playground/recipe.ts` — ДОКАЗАТЕЛЬСТВО, не поставка.** Он лежит в папке компонента, но никогда
не экспортируется из `index.ts`/`passport.ts`/`kit.ts` — читает его только тест самого
компонента, чтобы доказать: паспорт МОЖЕТ быть одет целиком настоящим механизмом скина. Витрина
(`products/skin`) этот файл не видит и не импортирует.

**Настоящий вид живёт отдельной службой**, локально — `http://127.0.0.1:8787/api/presets`.
Три вида записей: `palette`, `form` (рецепт ОДНОГО компонента, имя вида `omnifield-<компонент>`),
`outfit` (наряд — палитра + список имён форм, которые он реально носит). Компонент без формы в
этом списке рисуется БЕЗ единого правила скина — совсем не то же самое, что «сломанная
подсветка».

```bash
curl -s http://127.0.0.1:8787/api/presets | python3 -m json.tool   # что вообще есть
curl -s http://127.0.0.1:8787/api/presets/<id>                      # рецепт одной формы
```

Правки — только через `products/skin/src/entities/outfit/api/store.ts`'s `replace`
(снять старую запись по имени, положить новую с тем же именем — служба правок не знает, только
целые записи). Тот же рецепт, что в `playground/recipe.ts`, можно перегнать в JSON прямо из
исходника, не переписывая руками:

```bash
npx tsx -e "import('./src/listbox/playground/recipe.ts').then(m =>
  console.log(JSON.stringify({ name: 'omnifield-listbox', component: 'listbox', recipe: m.recipe })))"
```

## Прежде чем менять `playground/` — проверь живых потребителей

`assemblies`/`recipe.ts` выглядят как демонстрация кита, но необязательно ей ограничиваются:
сборка `accordion`'s `action-list` — рабочий сайдбар `products/skin` (список компонентов,
переход по клику), не только пример в тесте. Правка, ломающая форму данных или закрытый набор
событий, ломает продукт молча — без грепа по `products/` это не видно.

```bash
grep -rln "playground/assemblies\|from \"@omnifield/probe-web-ui" products/*/src
```

## Сетка размеров

Отступы/высоты контролов — производные шкалы от одного семени (`packages/style/src/dimension.ts`,
`DERIVED_SCALES`), и есть закрытая таблица «роль → ступень» (`SPACE_ROLES`) — например,
`control-padding-inline` (крупный контрол, `space-4`) обязана идти в паре с `minHeight:
control-height-md`, а `compact-padding-inline` (`space-3`) — с `control-height-sm`. Пара
проверяется гейтом по всем `playground/recipe.ts` разом (`test/space-roles.test.ts`) — разъезд
ловится прогоном, не ревизией архитектора вручную.

## Что ещё стоит на kobalte

Пять файлов (`button`, `flow`, `grid`, `surface`, `workspace`) берут `Polymorphic` из
`@kobalte/core/polymorphic` ради проброса `as` — единственное, что осталось от прежнего
поставщика. Для НИХ (и только для них) ещё жив `data-slot` — зацепка оформления, отдельная от
адреса анатомии (`test/utils`, если правишь — сверься с `utils/slot-chain.ts`, там же и предел
механизма: чужая обёртка посередине рвёт цепочку зацепок). Все остальные компоненты адресуются
исключительно анатомией (`data-scope`/`data-part`), `data-slot` на них нет вовсе — например,
аккордеон отказался от него явным решением при переезде на Ark.

## Что пакет не делает

- **Не привозит стили** — ни класса, ни инлайн-`style` по умолчанию; оформление приходит
  снаружи, кит только ставит адрес.
- **Не решает вид скина** — `packages/skin` читает паспорт и порождает CSS; кит паспорт только
  объявляет.
- **Не решает форму данных продукта** — `entity/io.ts` называет, что компонент способен принять,
  а не что именно ему дадут в конкретном приложении.

## Сборка и проверки

```bash
pnpm run generate    # обход папок → ./passport, ./io, KIT (генератор, отдельный шаг графа)
pnpm run build        # generate, затем vite build (JS) + tsc -p tsconfig.build.json (декларации)
pnpm run typecheck     # generate, затем tsc --noEmit по src/test/scripts
pnpm run lint           # eslint (пресет @omnifield/probe-web-lint) + typecheck
pnpm run test            # vitest run — три прогона проектов разом
pnpm run readme           # README.md каждого компонента из его passport/entity (генератор)
```

Три проекта vitest, не один: **`dom`** (JSDOM, живой рендер каждого примитива — тест «структура
модуля совпадает» здесь не считается, только рендер в документ), **`surface`** (Node, настоящий
`pnpm pack` и чтение тарбола) и **`live`** (Node, настоящий Chromium + сборка кита esbuild —
таймаут 180с у обоих последних, дефолтных 5с не хватает на поднятие рантайма).

Порождённые входы (`./passport`, `./io`, `KIT`) — свой шаг графа под `nx`, не деталь `build`:
лежат под `.gitignore`, и `build`/`typecheck`/`lint`/`test` зависят от шага явно, а не по
догадке порядка скриптов.

## Компоненты кита

Anatomy/states/settings у каждого — в его собственном `README.md`, которого нет смысла
дублировать здесь; ниже только адрес и на чём стоит.

| компонент | папка | на чём стоит |
|---|---|---|
| Accordion | `src/accordion/` | `@zag-js/accordion` |
| Avatar | `src/avatar/` | `@zag-js/avatar` |
| Button | `src/button/` | `@kobalte/core/button` |
| Carousel | `src/carousel/` | `@ark-ui/solid` |
| Checkbox | `src/checkbox/` | `@zag-js/checkbox` |
| DatePicker | `src/date-picker/` | `@zag-js/date-picker` |
| Dialog | `src/dialog/` | `@zag-js/dialog` |
| Drawer | `src/drawer/` | `@zag-js/drawer` |
| Field | `src/field/` | `@ark-ui/solid` |
| FileUpload | `src/file-upload/` | `@zag-js/file-upload` |
| Flow | `src/flow/` | наш, поведения нет |
| Grid | `src/grid/` | наш, поведения нет |
| Listbox | `src/listbox/` | `@ark-ui/solid` |
| Menu | `src/menu/` | `@zag-js/menu` |
| Popover | `src/popover/` | `@zag-js/popover` |
| RadioGroup | `src/radio-group/` | `@zag-js/radio-group` |
| ScrollArea | `src/scroll-area/` | `@zag-js/scroll-area` |
| SegmentGroup | `src/segment-group/` | `@zag-js/radio-group` |
| Select | `src/select/` | `@zag-js/select` |
| Slider | `src/slider/` | `@zag-js/slider` |
| Splitter | `src/splitter/` | `@zag-js/splitter` |
| Surface | `src/surface/` | наш, поведения нет |
| Switch | `src/switch/` | `@zag-js/switch` |
| Table | `src/table/` | `@tanstack/solid-table` |
| Tabs | `src/tabs/` | `@zag-js/tabs` |
| Timer | `src/timer/` | `@zag-js/timer` |
| Toast | `src/toast/` | `@zag-js/toast` |
| Toggle | `src/toggle/` | `@zag-js/toggle` |
| ToggleGroup | `src/toggle-group/` | `@zag-js/toggle-group` |
| TreeView | `src/tree-view/` | `@zag-js/tree-view` |
| Workspace | `src/workspace/` | наш, каркас именованными слотами |

Плюс служебные, не компоненты: `src/shared/` (реэкспорт `createListCollection`/`CollectionItem`
для `select`/`listbox`, чтобы `export *` в корневом `index.ts` не сталкивал два одинаковых
имени), `src/utils/` (`address.ts`/`slot-chain.ts`/`trace.ts` — внутренние помощники, наружу не
экспортируются).
