# 🔀 web-core IO

🏷️ data · 🧬 engine · 📦 `@web-core/io`

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

⚡ Универсальный вход/выход данных web-core: у всего в этом фреймворке структура —
сборка (`packages/assembly`), и наполнение сборки данными не должно решаться заново в каждом
продукте руками. Компонент несёт паспорт формы — что он ждёт на входе/выходе, — а наполнение идёт
через инструмент, который этот паспорт читает. 🛠️ Средство, а не решение, тем же приёмом, что и
`packages/assembly`: пакет не решает, что именно должно получиться, только чем это сделать.

🧬 Паспорт формы данных — НЕ поле `ComponentPassport` (`packages/skin`), а свой, отдельный реестр,
которым владеет этот пакет и только он: скин не зависит от данных, данные не зависят от скина
(решено user, 2026-08-29). `packages/io` не импортирует `packages/skin` и не будет.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У пакета один вход наружу (`.`) — «часть» здесь означает файл внутри `src/engine/`, а не
отдельный подпуть импорта. Слои перечислены по нарастанию цены: чем ближе к концу таблицы, тем
дороже слой и тем больше он предполагает про совпадение чужой формы с канонической.

| Часть                     | Файл                       | Экспортирует                                                                                          |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Zod (через пакет)         | `src/engine/index.ts`      | `z` — реэкспорт `zod`, единая точка объявления схем для всего кита                                    |
| Реестр паспортов          | `src/engine/registry.ts`   | `createIoRegistry`, `IoRegistry`, `IoEntry`, `IoMeta`, `IoDirection`                                   |
| L0/L1 — кодеки            | `src/engine/codecs.ts`     | `identityCodec`, `renameKeysCodec`                                                                     |
| L2 — правила полей        | `src/engine/field-rules.ts`| `applyFieldRules`, `collectFieldRuleReport`, `convertRecord`, `FieldRule`, `OnFail`, `ExtraPolicy`, `FieldRuleIssue`, `FieldRuleReport`, `RecordIssue` |
| L3 — форма целиком (повторы) | `src/engine/rows.ts`    | `discoverRowSets`, `discoverRowPaths`, `collectRowsReport`, `RowsResult`                                |
| Действия над значением    | `src/engine/steps.ts`      | `runStep`, `runSteps`, `isBlank`, `MAX_STEPS`, `Step` и 13 его вариантов (`TrimStep`, `DateStep`, …)   |
| Пути (JSON Pointer)       | `src/engine/paths.ts`      | `discoverPaths`, `describeSample`, `describeSchema`, `lookup`, `pointerOf`, `FieldRef`, `Lookup`, `PathType` (`assign` — внутренний, не в поверхности) |
| Подбор совместимых записей| `src/engine/compatible.ts` | `compatibleItems`                                                                                      |
| Реестр заготовок по теме  | `src/engine/packs.ts`      | `createPackRegistry`, `PackRegistry`                                                                    |

📦 `src/index.ts` — тонкий реэкспорт (`export * from "./engine/index.js"`), без единой строки
своей логики — тем же приёмом, что `packages/store`/`packages/assembly`/`packages/router`.

<h2 id="использование">🚀 Использование</h2>

✅ Восемь сценариев покрывают весь путь от объявления паспорта до отчёта по чужим данным.

**Паспорт формы — регистрация и чтение:**

```ts
import { createIoRegistry, z } from "@web-core/io";

const registry = createIoRegistry();

export const userIo = registry.register(
  "user-card",
  z.object({ name: z.string(), email: z.string().email() }),
);

const passport = registry.require("user-card"); // явный throw, если забыли зарегистрировать
```

**L0 — форма источника уже совпадает с паспортом:**

```ts
import { identityCodec, z } from "@web-core/io";

const codec = identityCodec(z.object({ id: z.number() }));
codec.decode({ id: 1 }); // { id: 1 }, прошло через схему
```

**L1 — структура та же, ключи другие:**

```ts
import { renameKeysCodec, z } from "@web-core/io";

const codec = renameKeysCodec(
  z.object({ full_name: z.string() }),
  z.object({ name: z.string() }),
  { full_name: "name" },
);

codec.decode({ full_name: "Ada" }); // { name: "Ada" }
codec.encode({ name: "Ada" }); // { full_name: "Ada" } — обратный словарь построен сам
```

**L2 — по структуре совпадает, значения нужно обработать:**

```ts
import { applyFieldRules, type FieldRule } from "@web-core/io";

const fields: FieldRule[] = [
  { target: "/name", from: "/full_name", steps: [{ kind: "trim" }] },
  { target: "/active", from: "/status", steps: [{ kind: "dictionary", values: { "1": "true" } }, { kind: "bool" }] },
];

const { row, issues } = applyFieldRules({ full_name: " Ada ", status: "1" }, fields);
// row: { name: "Ada", active: true }, issues: []
```

**Отчёт по множеству записей — не молчим, а считаем:**

```ts
import { collectFieldRuleReport } from "@web-core/io";

const { rows, report } = collectFieldRuleReport(rawRecords, fields);
// report.converted / report.rejected / report.issues (сгруппированные беды) / report.unmapped
```

**L3 — форма целиком: набор записей завёрнут где-то внутри чужого ответа:**

```ts
import { collectRowsReport, discoverRowPaths, discoverRowSets } from "@web-core/io";

const feed = { data: { items: [{ code: "s1", sum_kop: "12345", state: "A" }] } };

discoverRowSets(feed); // ["/data/items"] — предлагает, не выбирает
discoverRowPaths(feed, "/data/items"); // ["/code", "/sum_kop", "/state"]

const { rows, report, error } = collectRowsReport(feed, "/data/items", fields);
// error: null, rows/report — как у collectFieldRuleReport; путь мимо набора → error вместо пустого отчёта
```

**Плоский список полей — сэмпл данных и zod-схема одной формой:**

```ts
import { describeSample, describeSchema, z } from "@web-core/io";

describeSample({ id: "1", items: [{ title: "x", views: 5 }] });
// [{ path: "/id", type: "string" }, { path: "/items/0/title", type: "string" }, { path: "/items/0/views", type: "number" }]

describeSchema(z.object({ id: z.string(), items: z.array(z.object({ title: z.string() })) }));
// [{ path: "/id", type: "string" }, { path: "/items/0/title", type: "string" }]
```

Только СКАЛЯРНЫЕ листья (в отличие от `discoverPaths`, который отдаёт узлы промежуточных объектов
тоже — для `unmapped` в `collectFieldRuleReport`, это его законная задача). Путь — тот же JSON
Pointer, что у `FieldRule.from`/`.target`: значение из дропдауна поля сразу валидный `FieldRef`,
без конвертации формата туда-обратно.

**Подбор совместимых заготовок:**

```ts
import { compatibleItems, z } from "@web-core/io";

const items = compatibleItems(z.object({ label: z.string() }), themeItems);
// только те записи темы, что реально проходят схему, в исходном порядке
```

**Реестр заготовок по теме:**

```ts
import { createPackRegistry } from "@web-core/io";

const packs = createPackRegistry();
packs.register("status-colors", [{ value: "ok", color: "green" }, { value: "fail", color: "red" }]);
packs.require("status-colors");
```

<h2 id="настройки">🎚️ Настройки</h2>

🔧 Настроек нет только у чистых функций (`identityCodec`, `compatibleItems`, `discoverPaths` без
`depth`) — у остальных именованные опции таблицей, ко всей поверхности сразу.

| Настройка                | Где                                                          | Тип                                     | По умолчанию |
| ------------------------- | ------------------------------------------------------------ | ---------------------------------------- | ------------- |
| `direction`               | `registry.register(component, schema, direction?)`           | `IoDirection` (`"input"\|"output"\|"io"`) | `"io"`        |
| `extra`                   | `applyFieldRules`/`collectFieldRuleReport`                    | `ExtraPolicy` (`"drop"\|"keep"`)         | `"drop"`      |
| `onFail`                  | `FieldRule.onFail`                                            | `OnFail` (`"skip"\|"default"\|"reject"`) | `"skip"`      |
| `fallback`                | `FieldRule.fallback` (используется при `onFail: "default"`)   | `string`                                 | —             |
| `MAX_STEPS`               | `runSteps` — предел длины цепочки шагов в одном правиле       | `number` (константа)                     | `32`          |
| `DateStep.from`           | `steps.ts`, шаг `date`                                        | `"iso"\|"dmy"\|"unix"\|"unix-ms"`        | `"iso"`       |
| `RoundStep.digits`        | `steps.ts`, шаг `round`                                       | `number`                                 | `0`           |
| `DictionaryStep.otherwise`| `steps.ts`, шаг `dictionary`                                  | `"keep"\|"fail"`                         | `"keep"`      |
| `depth`                   | `discoverPaths(sample, depth?)` / `discoverRowPaths(input, rows, depth?)` / `describeSample(sample, depth?)` / `describeSchema(schema, depth?)` | `number` | `6` |
| `depth`                   | `discoverRowSets(input, depth?)`                              | `number`                                 | `4`           |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Ни на одном уровне нет тихого `undefined`/тихой перезаписи: путь не нашёлся, шаг не выполнился,
запись забракована — каждая беда несёт причину, а множество записей — счётчик, не разовое
исключение на первом же сбое.

| Состояние                   | Метка                                          | Где                                            |
| ---------------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Путь найден / не найден      | `{ found: boolean, value }`                     | `Lookup`, `lookup`                               |
| Шаг выполнен / провалился    | `{ ok: true, value }` \| `{ ok: false, reason }` | `StepResult`, `runStep`/`runSteps`               |
| Запись собрана / забракована | `Record<string, unknown>` \| `null`             | `convertRecord`, `applyFieldRules.row`           |
| Итог по множеству записей    | `{ total, converted, rejected, issues, unmapped }` | `FieldRuleReport`, `collectFieldRuleReport`   |
| Набор записей найден / не найден (структурная ошибка, отдельно от отчёта по полям) | `RowsResult.error: string \| null` | `collectRowsReport`     |
| Паспорт есть / нет           | `IoEntry` \| `undefined` (или явный throw у `require`) | `IoRegistry.get`/`.require`               |
| Тема есть / нет              | `readonly unknown[]` \| `undefined` (или явный throw у `require`) | `PackRegistry.get`/`.require`      |

<h2 id="io">🔌 IO</h2>

↔️ Вход и выход каждой функции — своя форма, но общий приём один: явный отказ (`require`, throw)
там, где вызывающий без результата дальше не может, и тихий пропуск (`get` → `undefined`, `skip`)
там, где отсутствие — законное состояние чужих данных, а не сбой программы.

### 📥 Вход

| Функция                                                       | Принимает                                                                  |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `registry.register`                                            | `(component: string, schema: Schema, direction?: IoDirection)`             |
| `identityCodec`                                                 | `(schema: Schema)`                                                          |
| `renameKeysCodec`                                               | `(input: A, output: B, mapping: Record<string, string>)`                   |
| `applyFieldRules` / `collectFieldRuleReport`                    | `(source(s): Record<string, unknown>[], fields: FieldRule[], extra?)`      |
| `collectRowsReport`                                             | `(input: unknown, rows: FieldRef, fields: FieldRule[], extra?)`            |
| `discoverRowSets`                                               | `(input: unknown, depth?: number)`                                         |
| `discoverRowPaths`                                              | `(input: unknown, rows: FieldRef, depth?: number)`                         |
| `runStep` / `runSteps`                                          | `(step(s): Step, value: unknown, source: unknown)`                         |
| `lookup` / `assign` / `pointerOf`                               | `(source/row, pointer: FieldRef, ...)`                                     |
| `discoverPaths`                                                 | `(sample: unknown, depth?: number)`                                        |
| `describeSample`                                                | `(sample: unknown, depth?: number)`                                        |
| `describeSchema`                                                | `(schema: z.ZodType, depth?: number)`                                      |
| `compatibleItems`                                               | `(schema: Schema, items: readonly unknown[])`                              |
| `packs.register`                                                | `(theme: string, items: readonly unknown[])`                               |

### 📤 Выход

| Источник                                     | Отдаёт                                                                |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `registry.get` / `.require`                    | `IoEntry { schema, meta }` \| `undefined` / `IoEntry`                    |
| `identityCodec` / `renameKeysCodec`            | `z.ZodCodec` (`decode`/`encode`)                                          |
| `applyFieldRules`                              | `{ row: Record<string, unknown> \| null, issues: RecordIssue[] }`        |
| `collectFieldRuleReport`                       | `{ rows: Record<string, unknown>[], report: FieldRuleReport }`           |
| `collectRowsReport`                            | `RowsResult { rows, report, error: string \| null }`                     |
| `discoverRowSets` / `discoverRowPaths`         | `FieldRef[]`                                                              |
| `runStep` / `runSteps`                         | `StepResult`                                                              |
| `lookup`                                       | `Lookup`                                                                  |
| `discoverPaths`                                | `FieldRef[]`                                                              |
| `describeSample` / `describeSchema`            | `PathType[]`                                                              |
| `compatibleItems`                              | `z.infer<Schema>[]`                                                       |
| `packs.get` / `.require`                       | `readonly unknown[]` \| `undefined` / `readonly unknown[]`               |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Показаны только композиции, реально прогнанные тестами, — не теоретические примеры.

| Сборка                                              | Что доказывает                                                                  | Файл                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------- |
| `runSteps` — цепочка нескольких `Step` подряд         | обрыв на первой неудаче с указанием номера шага; длиннее `MAX_STEPS` — явный отказ | `test/steps.test.ts`            |
| `applyFieldRules` (`from` + `steps` + `onFail`)       | канон собирается по правилам; `extra: "keep"` проносит чужое; `onFail: "reject"` бракует запись целиком, не только поле | `test/field-rules.test.ts` |
| `collectFieldRuleReport` по множеству записей         | `converted`/`rejected` считаются; одинаковые беды агрегируются в один `issue` с `count`; `unmapped` называет непойманные чужие поля | `test/field-rules.test.ts` |
| `applyFieldRules` в обе стороны — приём и отдача как два НЕЗАВИСИМЫХ списка `FieldRule[]` | отдача не выводится разворотом приёма, пишется руками отдельно; тот же движок, другой список правил | `test/field-rules.test.ts` |
| `discoverRowSets` → `discoverRowPaths` → `collectRowsReport` — L3 целиком | путь до завёрнутого набора находится по образцу, пути внутри записи — по выбранному пути, дальше работает L2; путь мимо набора — явная структурная ошибка, не пустой отчёт | `test/rows.test.ts` |
| `renameKeysCodec` round-trip (`decode∘encode`, `encode∘decode`) | обратный словарь строится сам из прямого; round-trip восстанавливает исходное | `test/codecs.test.ts` |
| `compatibleItems` по смешанной теме                   | из записей разной формы — только реально проходящие схему, в исходном порядке      | `test/compatible.test.ts`       |
| `describeSample` / `describeSchema` — сэмпл и схема одной формой | результат содержит только скалярные листья (объекты/массивы не появляются сами по себе); путь — JSON Pointer с индексом (`/a/0`, не голое `[]`); `$ref`-цикл схемы → `"recursive"`, не бесконечный обход; `depth` глушит обход молча, как у `discoverPaths` | `test/paths.test.ts` |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Мотивирующий случай — тот же, что был у `products/tables/src/adapter` до переноса сюда: чужой
JSON-фид с несовпадающими именами и значениями полей → канон компонента, с отчётом о том, что не
легло.

```ts
import { collectFieldRuleReport, createIoRegistry, z, type FieldRule } from "@web-core/io";

const registry = createIoRegistry();
// placedAt — optional: onFail по умолчанию "skip", запись без даты всё равно должна пройти парсинг.
const orderSchema = registry.register(
  "order-row",
  z.object({ customer: z.string(), placedAt: z.string().optional(), amount: z.number() }),
);

const fields: FieldRule[] = [
  { target: "/customer", from: "/client_name", steps: [{ kind: "trim" }] },
  { target: "/placedAt", from: "/date", steps: [{ kind: "date", from: "dmy" }] },
  { target: "/amount", from: "/total", steps: [{ kind: "number" }, { kind: "round", digits: 2 }] },
];

const feed = [
  { client_name: " Ада ", date: "04.09.2026", total: "1 234,5" },
  { client_name: "Марк", date: "не дата", total: "10" },
];

const { rows, report } = collectFieldRuleReport(feed, fields);
// Прогнано по-настоящему (node), не выведено по памяти:
// rows === [
//   { customer: "Ада", placedAt: "2026-09-04T00:00:00.000Z", amount: 1234.5 },
//   { customer: "Марк", amount: 10 }, // onFail по умолчанию — skip, не reject: поля /placedAt просто нет
// ]
// report === { total: 2, converted: 2, rejected: 0,
//   issues: [{ target: "/placedAt", reason: "шаг 1 (date): не дата вида дд.мм.гггг", count: 1, examples: ["не дата"] }],
//   unmapped: [] }

for (const row of rows) orderSchema.parse(row); // паспорт проверяет то, что реально попало в канон
```
