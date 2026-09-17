# 🥣 web-core Feeder

🏷️ interfaces · 🧬 engine · 📦 `@web-core/feeder`

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
- 🧪 [Примеры](./EXAMPLES.md)

<h2 id="главное">🏠 Главное</h2>

⚡ Первая сущность нового корня `interfaces/` — слоя между `packages/` (кирпичи) и `apps/`
(поверхности): сущность здесь сводит функционал нескольких пакетов фреймворка и накладывает на
него UI, а пользуется результатом больше чем одно приложение (скин, будущие админки/дэшборды).
`interfaces/chat` — второй ожидаемый кейс этого же слоя, ещё не заведён.

🍽️ Feeder сводит `@web-core/generators` и `@web-core/io` в переиспользуемый интерфейс
настройки/загрузки данных по трём задуманным режимам: (1) зод-схема → дерево с ручным
редактированием значений (типизировано целиком — структуру юзер не меняет, только наполняет);
(2) распознавание ручек по шаблону формата/версии (openapi и не только — как сегодня в
`apps/skin/entities/openapi`, но с реально разобранной схемой тела, не голым textarea); (3) загрузка
файла — источник неизвестной формы, как и (2), требует сведения «корм → потребитель».

🚧 Реализованы моды 1, 2 и 4. Мод 1 (`Tree`) — перенесён из `apps/skin/entities/feeder`, оторван от
`componentStore.use(kit).io.schema`: источник схемы и значение — пропы движка, не жёстко зашитый
skin-адаптер. Уже подключён живым потребителем (`apps/skin/src/pages/index.tsx`, панель настроек
компонента в лабе) и проверен там же вручную через браузер — рендер и запись по всем трём операциям
(правка скаляра, добавление/удаление элемента списка) корректны.

Мод 2 (`OpenapiEditor`+`OpenapiList`) оказался типизированным движком, как мод 1, а не
«нетипизированным сведением» — Swagger 2.0 сам заявляет типы параметров, схема строится напрямую
при распознавании (разбор ошибочного первого предположения — FAQ.md). Два вида под разный экран
(«настроить ручку» и «просто дёрнуть уже настроенную») — своя находка user поверх исходного плана.
Сам HTTP-вызов — на стороне движка (`@web-core/query/rest`), не потребителя. Живого браузера с
модом 2 не было (в отличие от мода 1) — только vitest+jsdom, см. «Сборки».

`OpenapiEditor` работает не с одним документом, а с ГРУППАМИ (`OpenapiGroup`) — у юзера бывает
сколько угодно бэков со сваггером и сколько угодно вообще без него, ручки без документа заводятся
вручную (схема A — `EndpointDescriptor`, редактируется той же `Tree`, что и мод 1), и группы не
сливаются в общий список, каждая подписана юзером. Группа-схема (`SchemaGroup`) — read-only состав,
группа-юзер (`ManualGroup`) — редактируемая. Находка user поверх и без того непервоначального
плана, разбор — FAQ.md.

Мод 4 (`Mapping`) — сведение «корм → потребитель»: два варианта (А/Б, каждый — сырые данные ИЛИ
zod-схема), юзер сводит поля, движок отдаёт готовый `FieldRule[]`+результат. Завёлся НЕ как часть
задуманных трёх режимов, а отдельной находкой user поверх исходного плана — мод 2 сам по себе
оказался бесполезен без способа скормить его ответ конкретному потребителю, а сведение не привязано
к тому, откуда А взялось (годится и мод 1, и мод 2, и будущий мод 3). Целиком поверх headless-кирпичей
`@web-core/io` (`describeSample`/`describeSchema`/`applyFieldRules`) — от feeder только интерфейс.

Мод 3 не реализован — разбор направления, — FAQ.md, план — ROADMAP.yaml. По следам мода 4 его
объём сузился: recognized-сэмпл файла можно скормить прямо в готовый `Mapping`, не изобретая свой
UI сведения заново.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ Как и у любого движка без DOM-паспорта — «часть» здесь означает подпуть поставки, «адрес» —
импорт-спецификатор. Сегодня один вход, без подпутей.

| Часть                   | Адрес             | Экспортирует                          |
| ------------------------ | ------------------ | --------------------------------------- |
| Дерево (мод 1)           | `@web-core/feeder` | `Tree`                                |
| Редактор ручек (мод 2)   | `@web-core/feeder` | `OpenapiEditor`, `OpenapiInvocation`, `OpenapiGroup`, `SchemaGroup`, `ManualGroup`, `EndpointDescriptor`, `EndpointParam` |
| Список ручек (мод 2)     | `@web-core/feeder` | `OpenapiList`, `OpenapiListItem`      |
| Сведение (мод 4)         | `@web-core/feeder` | `Mapping`, `MappingChange`            |
| Плейсхолдер (dev-проба)  | `@web-core/feeder` | `FeederPlaceholder`                   |

📦 Внутри — адаптированный FSD (как в `apps/skin`, откуда физически перенесён мод 1), но
переосмысленный под движок, а не бизнес-приложение: `entities` — структурная модель самого движка
(узел дерева, распознавание формата), не бизнес-сущность; `features` — фичи интерфейса
(отредактировать значение, вызвать ручку), не бизнес-операция; `widgets` — сборка entities+features
в готовый UI мода. Без `app`/`pages` — пакет не приложение с роутингом, входы наружу — экспорты
пакета (мод = export, не страница).

Мод 1: `entities/tree` (модель узла, биндинг), `features/edit-value` (инпуты редактирования),
`widgets/tree` (сборка дерева). Мод 2: `entities/openapi` (свой `MappingTemplate` под Swagger 2.0 —
распознавание + сборка `z.ZodType` на ручку; плюс `EndpointDescriptor`+`descriptorToEndpoint` —
схема A и адаптер под вручную заведённые ручки, без документа-источника), `features/invoke-endpoint`
(реальный HTTP-вызов, `@web-core/query/rest`), `widgets/openapi` — `OpenapiEditor` (список ГРУПП,
`SchemaGroupView` read-only внутри группы-схемы + `ManualGroupEditor` — `Tree` для структуры
дескрипторов группы-юзера, обе переиспользуют `EndpointCard`/`Node` из `widgets/tree` для
конфигурации значений одной ручки) и `OpenapiList` (без конфигурации, только вызов уже
настроенного). Мод 4: `entities/mapping` (тонкая обёртка над `describeSample`/`describeSchema`/
`applyFieldRules` из `@web-core/io` — механика целиком в `io`, здесь только типизация «двух
вариантов»), `widgets/mapping` (`Mapping`+`FieldPicker` — список полей Б, на каждое нативный
`<select>` из путей А). Решения и разбор — FAQ.md.

<h2 id="использование">🚀 Использование</h2>

✅ Мод 1 (`Tree`) — полностью контролируемый компонент, схема и значение приходят снаружи, движок
сам ничего не хранит:

```tsx
import { Tree } from "@web-core/feeder";
import { z } from "@web-core/io";

const schema = z.object({ name: z.string(), active: z.boolean() });

function Settings() {
  const [value, setValue] = createSignal<unknown>({});
  return <Tree schema={schema} value={value()} onChange={setValue} />;
}
```

✅ Мод 2 — два вида: `OpenapiEditor` (список групп — распознанный Swagger 2.0 и/или вручную
заведённые ручки, конфиг параметров, вызов) и `OpenapiList` (уже настроенные ручки, только
«Вызвать», без единого поля):

```tsx
import { OpenapiEditor, type OpenapiGroup, type OpenapiInvocation } from "@web-core/feeder";

function ApiEditor() {
  const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>([
    { id: "1", name: "Основной бэк", kind: "schema", raw: swaggerText },
  ]);
  return (
    <OpenapiEditor
      groups={groups()}
      onGroupsChange={setGroups}
      onChange={(invocation: OpenapiInvocation) => save(invocation)}
    />
  );
}
```

✅ Мод 4 — сведение: `a`/`b` каждый сырые данные или zod-схема, на каждое поле `b` юзер выбирает
путь `a`, `onChange` живой (на каждый пик, как мод 1, не по кнопке):

```tsx
import { Mapping, type MappingChange } from "@web-core/feeder";

function Adapter() {
  return <Mapping a={apiResponse} b={targetSchema} onChange={(change: MappingChange) => save(change.rules)} />;
}
```

Разбор всех случаев, живой (реально стучится в сеть) пример `OpenapiEditor`, флоу
редактор→сохранить→`OpenapiList`, мод 4 на ответе мода 2 и как подключить для теста в
`apps/skin/src/pages/lab` — [`EXAMPLES.md`](./EXAMPLES.md). Живой пример `Tree` в проде —
`apps/skin/src/pages/index.tsx`.

<h2 id="настройки">🎚️ Настройки</h2>

🔧 У `Tree` один обязательный проп-настройка — `schema: z.ZodType` (`@web-core/io`), источник дерева
полей (`fieldsOf` из `@web-core/generators/fields`). У `OpenapiEditor` — `groups:
OpenapiGroup[]` (`SchemaGroup { raw }` — сырой Swagger 2.0, read-only состав; `ManualGroup {
endpoints: EndpointDescriptor[] }` — вручную заведённые дескрипторы, редактируемые), у `OpenapiList`
— `items: { endpoint, value }[]` (уже настроенные ручки). У `Mapping` — `a`/`b: unknown` (сырые
данные ИЛИ `z.ZodType`, каждый сам по себе). Опций самого движка (порядок полей, кастомные рендеры
листа, другие форматы кроме Swagger 2.0, `headers`/`enum`/`array` у `EndpointParam`,
трансформации/`onFail` у `FieldRule` в UI мода 4) пока нет ни у одного мода.

<h2 id="состояния">🎛️ Состояния</h2>

🚦 `Tree` — своих состояний нет, полностью контролируемый (`value`/`onChange` снаружи), внутри
только производные `createMemo` от `schema`/`value`. `OpenapiList` — так же, без состояния.
`OpenapiEditor` — сам список групп полностью контролируемый (`groups`/`onGroupsChange` снаружи,
как и структура дескрипторов группы-юзера — правки идут через тот же `onGroupsChange`, не хранятся
внутри); локально движок держит только форму «добавить группу» (имя+вид, до нажатия кнопки). Внутри
группы-схемы — распознавание (`createResource` от `raw`); внутри каждой карточки (`EndpointCard`,
в любой группе) — локальный `value`/`status` сигнал с настроенными параметрами вызова, наружу не
текущий на каждую правку (наружу — только на сам вызов, см. «IO»). `Mapping` — локальный сигнал
`picks` (какой путь `a` выбран на каждое поле `b`), наружу течёт на каждый пик (как `Tree`, не как
`EndpointCard`). Управление сбросом/начальным значением у `Tree` — забота потребителя, не движка.

<h2 id="io">🔌 IO</h2>

↔️ Мод 1: вход — `schema: z.ZodType` (структура) + `value: unknown` (текущие данные), выход —
`onChange(value: unknown)` на каждое изменение любого поля (запись идёт через `withValue` по пути
поля, наружу — новый цельный объект, не патч).

Мод 2: вход `OpenapiEditor` — `groups: OpenapiGroup[]` + `onGroupsChange`. Группа-схема несёт
`raw: string` (сырой Swagger 2.0, жёсткое совпадение, другой формат/версия отклоняется) — свой
состав read-only, изменить можно только заменой `raw` целиком через `onGroupsChange`. Группа-юзер
несёт `endpoints: EndpointDescriptor[]` — юзер добавляет/убирает/правит их сам (через `Tree` внутри
`OpenapiEditor`), правки идут наружу тем же `onGroupsChange`. Вход `OpenapiList` — `items: {
endpoint, value }[]` (уже настроенные). Выход обоих виджетов — `onChange(invocation:
OpenapiInvocation)`, `{ endpoint, value, response }`, стреляет НЕ на правку поля (как мод 1) и НЕ на
правку группы, а на реальный вызов ручки (`@web-core/query/rest`) — ответ ручки и есть «еда».
`{ endpoint, value }` из инвокации — готовый айтем для `OpenapiList` (флоу «настроил в редакторе →
сохранил → дёрнул на витрине», примеры — EXAMPLES.md). Контракт мода 3 (сырой «корм» неизвестной
формы на входе) появится с ним.

Мод 4: вход — `a`/`b: unknown` (сырые данные или `z.ZodType` каждый, `describeVariant` сам
распознаёт по `instanceof`). Выход — `onChange(change: MappingChange)`,
`{ rules: FieldRule[], result: { row, issues } }`, на каждый пик поля (не по кнопке, в отличие от
мода 2) — `result.row` уже замаплен на форму `b` по текущим `rules`. Сохранение `rules` для
переиспользования на новых данных той же формы — забота потребителя (бэк, по словам user).

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Vitest+jsdom, 52 теста. Мод 1: `entities/tree` — чистая логика (`itemBinding`, `useTree`, 8
тестов, без DOM, `schema` реальная через `fieldsOf`); `widgets/tree` — настоящий DOM-рендер
(`solid-js/web`, не мок, 3 теста): скаляр пишет по пути, «Добавить»/«Убрать» на элемент списка.

Мод 2: `entities/openapi` — распознавание + сборка схемы на реальном (урезанном) petstore-документе
(8 тестов, включая вложенные `$ref` и циклы через `z.lazy`), плюс `descriptor.ts` — схема A и
`descriptorToEndpoint` на дескрипторах без документа-источника (7 тестов); `features/invoke-
endpoint` — мок `fetch` (`vi.stubGlobal`), path/query/body собираются верно, не-2xx — валидный
результат, не исключение (5 тестов); `widgets/openapi` — реальный DOM-рендер, `OpenapiEditor`
(11 тестов: группа-схема, группа-юзер, добавление/удаление самой группы) и `OpenapiList`
(3 теста), доезжает до мока `fetch` и обратно до `onChange`.

Мод 4: `entities/mapping` — `describeVariant`/`applyMapping` тонкой обёрткой над `@web-core/io`
(6 тестов); `widgets/mapping` — реальный DOM-рендер, пик поля/сброс/несколько полей независимо
(5 тестов). `FieldPicker` — нативный `<select>` (`FieldSelect` из `@web-core/ui`), не Ark-UI
`Select` (как в `EnumInput` мода 1): последний в принципе не открывается в jsdom (ни click, ни
pointer-события, ни клавиатура — проверено эмпирически), нативный `<select>`+`change` тестируется
штатно. Разбор — FAQ.md.

Ark-UI/Zag/Kobalte внутри `@web-core/ui` отдают сырой `.jsx` по `solid`-condition — vitest пытается
грузить его напрямую через Node и падает (`Unknown file extension ".jsx"`); лечится
`test.server.deps.inline` в `vitest.config.ts` (гонит эти пакеты через vite-transform, не через
голый Node `require`). `build`/`typecheck`/`lint` зелёные. Живого браузера с модами 2/4 не было
(мод 1 проверен живьём, см. «Главное»).

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Мод 2 обошёлся без съёмного слоя сведения — Swagger 2.0 сам несёт типы, схема строится напрямую
(`@web-core/generators/mapping`, свой `MappingTemplate`), адаптер «корм → потребитель» поверх
`describeSample`/`FieldRule` из `@web-core/io` ему не понадобился (ошибочное первое предположение,
разбор — FAQ.md).

Сам адаптер построен отдельно — мод 4 (`Mapping`), не привязан ни к одному конкретному моду: берёт
ЛЮБЫЕ два варианта (сырые данные или схему) и сводит поля вручную поверх `describeSample`/
`describeSchema`/`applyFieldRules` из `@web-core/io` (движок целиком там, от feeder — интерфейс).
Мод 3 (файл), когда дойдёт очередь, сможет переиспользовать `Mapping` напрямую — не изобретать свой
UI сведения заново, см. ROADMAP.yaml.
