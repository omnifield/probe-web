# 📦 Служба раздачи (`presets`)

🏷️ skin · 🧬 presets · 📦 `@web-core/skin/presets`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🚀 [Использование](#использование)
- 🔌 [IO](#io)
- 🎛️ [Состояния](#состояния)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

📡 Клиент и источник скина поверх службы раздачи пресетов (палитра/форма/наряд/сборка/контент/тег) —
GraphQL под капотом, `PresetRecord<T>` наружу. Два независимых конструктора на один и тот же адрес:

| Конструктор | Отвечает на вопрос |
|---|---|
| `createPresetsSkinSource({ url, lookup })` | «что сейчас надето» — `SkinSource` для `makeSkinSwitch`/`SkinProvider` |
| `createPresetsClient({ url })` | «что вообще есть в службе» — каталог: список/чтение/CRUD по любому виду |

Оба не обязаны жить рядом друг с другом или доставаться один из другого — где именно завести общий
экземпляр (и заводить ли вообще один на приложение), решает архитектура потребителя.

<h2 id="использование">🚀 Использование</h2>

**Полный CRUD по каждому виду:**

```ts
import { createPresetsClient, PRESET_KIND } from "@web-core/skin/presets";

const client = createPresetsClient({ url });

await client.save(PRESET_KIND.palette, "brand", palette);
const buttonForms = await client.list(PRESET_KIND.form, { component: ["button"] });
const outfit = await client.get(PRESET_KIND.outfit, "twitter");
await client.replace(PRESET_KIND.form, "button-primary", nextForm);
await client.remove(PRESET_KIND.form, "button-primary");
```

**Как источник скина** (обычно передаётся в `makeSkinSwitch`/`SkinProvider`, не зовётся напрямую):

```ts
import { createPresetsSkinSource } from "@web-core/skin/presets";
import { passportOf } from "@web-core/ui/passport";

const source = createPresetsSkinSource({ url, lookup: passportOf });
```

**Сборки компонента, до его рендера, без обращения к `SkinConnection`.** `list`/`get` — обычные
чтения каталога, не завязанные ни на надетый наряд, ни на то, отрисован ли компонент вообще:

```ts
const assemblies = await client.list(PRESET_KIND.assembly, { component: [componentName] });
```

**Варианты компонента — в рамках ОДНОГО надетого наряда.** У формы нет собственного адреса вне
наряда (компонент может иметь несколько form-записей — по одной на наряд, `checkOutfit` не даёт
двум формам ОДНОГО компонента ужиться в ОДНОМ наряде, флаг `component-twice`) — значит вопрос
«какие у кнопки варианты» без уточнения наряда не имеет одного ответа. `variantsOf` берёт эту
привязку явно:

```ts
import { variantsOf } from "@web-core/skin/presets";

const variants = await variantsOf(client, outfitName, "button");
// [{ name: "primary", tags: ["default"] }, { name: "quiet", tags: ["default"] }, …]
```

Имя наряда назвать необязательно — без него берётся тот, что реально надет на корень прямо сейчас
(`wear()`), тот же источник, что стоит за `worn()` у `SkinConnection`, но без хука и без Solid-контекста:

```ts
const variants = await variantsOf(client, "button");
```

Ничего не надето (или вызов не в браузере — Node/SSR) — тот же пустой список, что и у ненайденного
наряда, не отказ.

Список плоский — фильтр по тегу/группировка дальше обычным `.filter()`/`groupByTag()`
(`@web-core/skin/tags`) над уже полученным массивом, без второго похода в сеть. Список форм по
ВСЕМ нарядам сразу (не только надетому) — вне объёма этой функции, отдельная задача, если
понадобится.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

| Конструктор | Принимает |
|---|---|
| `createPresetsClient({ url })` | адрес службы раздачи (`/graphql` целиком) |
| `createPresetsSkinSource({ url, lookup })` | тот же адрес + `PassportLookup` кита |
| `client.list(kind, { component? })` | вид записи; `component` сужает выдачу до ЛЮБОГО из перечисленных (OR) |
| `client.get(kind, name)` | вид + имя записи |
| `client.save/replace(kind, name, state, label?)` | вид, имя, содержимое (форма своего вида), необязательный ярлык |
| `client.remove(kind, name)` | вид + имя |

⚠️ `component` в `list()` несёт смысл только у видов с полем `component` в схеме — `form`/`assembly`/
`content`. У `palette`/`outfit`/`tag` такого поля нет: запись при заданном фильтре в выдачу НЕ
попадёт (не ошибка — контракт схемы, разбор — FAQ.md).

<h3 id="io-выход">📤 Выход</h3>

`PresetRecord<T>` — запись службы целиком:

| Поле | Значит |
|---|---|
| `id` | идентификатор для человека в отладчике — операции клиента адресуют ИМЕНЕМ, не им |
| `label` | имя для человека |
| `name` | имя для машины — им запись зовут наряд и источник; уникально В ПРЕДЕЛАХ вида |
| `kind` | вид записи (`PRESET_KIND`) |
| `savedAt` | когда записана — ставит служба, не клиент |
| `state` | содержимое: `Palette`/`Form`/`Outfit`/`ComponentAssembly`/`ContentState`/`Tag` — по виду |

`get(kind, name)` — запись либо `undefined` (такой в службе нет, не отказ). `remove(kind, name)` —
имени нет — уже убрано, тоже не отказ (идемпотентно). `save` кладёт новую запись (уникальность имени
держит служба), `replace` кладёт запись вместо прежней с тем же именем и ярлыком — одна атомарная
замена.

<h2 id="состояния">🎛️ Состояния</h2>

| Класс | Значит |
|---|---|
| `PresetsDown` | службы физически нет по адресу — обрыв связи, 5xx |
| `PresetsRefused` | служба ответила и отказала — занятое имя, неизвестный вид, кривой конверт |
