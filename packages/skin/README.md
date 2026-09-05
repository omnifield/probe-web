# 🎨 web-core Skin

🏷️ skin · 🧬 engine · 📦 `@web-core/skin`

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

🎨 Механика скина — используйте, если безголовому киту нужен вид: паспорт компонента, сборка
рецепта по частям, адресация из анатомии, порождение CSS и само надевание/снятие скина
приложением. 🧬 Один сквозной поток от объявления до документа: паспорт → наряд (палитра + формы)
→ сборка → CSS → надет. 🛠️ Средство, а не решение — механика не приносит своего вида и не решает,
каким скину быть: цвет, форму и роли называет тот, кто пишет наряд, здесь только то, чем это
собрать и надеть.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM — часть здесь означает подпуть поставки. Семь точек входа, каждая — свой срез
того, что реально нужно потребителю: от голого чтения паспорта без порождения CSS до Solid-плагина,
который движок вообще не обязан знать.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Модель (срез рантайма) | `@web-core/skin/model` | `ComponentPassport`, `PassportAnatomy`, `PassportPart`, `PassportSetting*`, `PassportVariantAxis`, `definePassport`, `createAnatomy`, `defineSettings`, `SETTINGS`, `settingApplies`, `addressesView`, `PassportLookup`, `passportLookup`, `coordinateOf`, `partOf`, `SkinAncestor`, `SkinCoordinate`, `BoundModel`, `withPassports`, `SkinGap(Kind)`, `skinGaps`, `GROW_SHRINK_BLOCK/INLINE`, `DARK_CLASS`/`FORCE_ATTRIBUTE`/`LAYER_ORDER`/`NODE_ATTRIBUTE`/`SKETCH_LAYER`/`SKIN_LAYER`, `Form`/`Outfit`/`Palette`, `OutfitRefused`, `Role`/`RoleKind`, `knownRole`, `ROLE_NAMES`, `SCALE_ROLES`, `VOCABULARY`, типы рецепта (`Skin`, `SlotRecipe`, …) |
| Корень (модель + порождение) | `@web-core/skin` | всё из `./model` плюс `SkinRefused`, `withPassports` (с `generateSkinCss`/`generateSketchCss`), `BoundSkin`, `skinContrast`, `INDISTINCT`, типы контраста |
| Плоский CSS | `@web-core/skin/flat` | `flattenCss` |
| Срез редактора | `@web-core/skin/editor` | `admits`, `defineEditorInfo`, `checkAssembly`, `checkAssemblyData`, `footprintOf`, `GROUPS`, `groupOf`, `baseAssemblyOf`, `isAssemblyContent`, `isAssemblyRepeat`, `isContentNode`, `isDataBinding`, `resolveDataBinding`, `PassportAssembly`, `PassportEditorInfo` и её срез-типы |
| Служба раздачи | `@web-core/skin/presets` | `createPresetsClient`, `createPresetsSkinSource`, `PRESET_KIND`, `PresetsDown`, `PresetsRefused`, `PresetRecord` |
| Надевание | `@web-core/skin/wear` | `makeSkinSwitch`, `checkStyleOrder`, `SkinSwitch`, `SkinSource`, `SkinWorn`, `SkinMode`, `StyleMarker`, `StyleOrderReport` |
| Solid-плагин | `@web-core/skin/solid` | `createSkinConnection`, `SkinConnection` |

📦 Внутри пакета: `src/index.ts` — тонкий барель поверх `src/engine/` (та же форма, что у
`assembly`/`store`). `src/engine/` несёт всё, что не экспортируется отдельным подпутём: паспорт,
адресацию, значения (семена/шкалы/текучий размер — чистая арифметика печати, без своего глагола
наружу), словарь ролей, рецепт, сборку правил, покрытие, контраст, порождение. `editor/`, `flat/`,
`wear/`, `solid/`, `presets/` — отдельные папки один в один со своими точками входа.

<h2 id="использование">🚀 Использование</h2>

**Объявить паспорт компонента:**

```ts
import { definePassport, defineSettings } from "@web-core/skin/model";
import { anatomy } from "./anatomy.js"; // @zag-js/anatomy

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [{ name: "disabled", mark: { kind: "attribute", name: "data-disabled" } }] },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: defineSettings<ComponentProps>()({}),
});
```

**Собрать наряд и напечатать CSS:**

```ts
import { withPassports } from "@web-core/skin";
import { passportOf } from "@web-core/ui/passport";

const { assemble, generateSkinCss } = withPassports(passportOf);
const { skin, report } = assemble(outfit, { palettes, forms });
const css = generateSkinCss(skin);
```

**Надеть скин (без Solid) и проверить порядок подключения:**

```ts
import { checkStyleOrder, makeSkinSwitch } from "@web-core/skin/wear";
import { BASE_MARKER } from "@web-core/style";

const skin = makeSkinSwitch(source, { fallback: { skin: "twitter", mode: "dark" } });
await skin.restore();
checkStyleOrder({ marker: BASE_MARKER });
```

**Служба раздачи как источник, полный CRUD по каждому виду:**

```ts
import { createPresetsClient, createPresetsSkinSource, PRESET_KIND } from "@web-core/skin/presets";

const source = createPresetsSkinSource({ url, lookup: passportOf });
const client = createPresetsClient({ url });
await client.save(PRESET_KIND.palette, "brand", palette);
```

<h2 id="настройки">🎚️ Настройки</h2>

⚙️ Настраиваются заводимые механизмы, а не глобальный переключатель — у каждого конструктора свой,
независимый набор.

| Конструктор | Настройка | По умолчанию |
|---|---|---|
| `makeSkinSwitch(source, options)` | `storageKey` | `"web-core:skin"` |
| | `fallback: { skin?, mode? }` | не задан — голый кит, если ничего не запомнено |
| `createSkinConnection(source, options)` | те же, что у `makeSkinSwitch` | те же |
| `createPresetsClient({ url })` | `url` | обязательное |
| `generateSkinCss(skin, lookup, vocabulary?)` | `vocabulary` | пустой словарь — сверх словаря ролей ничего не проверяется |
| `SkinWearOptions.remember` | запоминать ли выбор | `true` |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Состояние здесь — не рантайм-стейт компонента, а именованный отказ или разбор проверки: то, по
чему потребитель решает, что сказать человеку.

| Источник | Имя | Значит |
|---|---|---|
| `checkStyleOrder` (`StyleOrderStatus`) | `ok` \| `missing-base` \| `no-skin` | приехал ли базовый CSS под надетым скином |
| Служба раздачи | `PresetsDown` \| `PresetsRefused` | службы физически нет / служба ответила и отказала |
| Порождение | `SkinRefused` | неизвестное значение молча проезжало бы в CSS |
| Проверка наряда | `OutfitRefused` (несёт `flaws`) | наряд не собирается — палитра/форма неполны или конфликтуют |
| Сборка компонента | `AssemblyDataFlaw` (через `checkAssemblyData`) | данные не проходят по объявленным путям |

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

| Конструктор | Принимает |
|---|---|
| `withPassports(lookup)` | `PassportLookup` — как найти паспорт компонента по имени |
| `assemble(outfit, parts)` | `Outfit` + `{ palettes: Palette[], forms: Form[] }` |
| `generateSkinCss(skin, vocabulary?)` | собранный `Skin` |
| `makeSkinSwitch(source, options)` | `SkinSource` — `names()`/`css(name)` |
| `createPresetsClient({ url })` | адрес службы раздачи |
| `checkStyleOrder({ marker })` | пара «свойство → значение», которую база обязана поставить |

<h3 id="io-выход">📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `assemble` | `{ skin: Skin, report: OutfitReport }` |
| `checkOutfit`/`checkSkin` | перечень изъянов значением, не исключением |
| `generateSkinCss` | текст CSS, вложенная форма |
| `SkinSwitch.worn()`/`SkinConnection.worn` | `SkinWorn | null` — синхронно и сигналом соответственно |
| `skinGaps` | перечень непокрытых координат |
| `skinContrast` | перечень пар, не прошедших норму читаемости, и пар, которые посчитать нечем |
| `PresetsClient.list/get` | `PresetRecord<T>` — запись целиком, с содержимым |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Своих сборок компонентов у механики нет — она их не знает. Доказывается голыми, синтетическими
записями (58 тестов, 14 файлов) плюс живой проверкой на реальном наряде и реальном ките.

| Сборка | Что доказывает |
|---|---|
| `test/*.test.ts` пакета | паспорт/сборка/сборка правил/порождение/адресация — каждый узел решения отдельно |
| `recipe.test.tsx` каждого компонента кита | `skinGaps`+`passportLookup` реально используются снаружи для проверки покрытия одного паспорта |
| `apps/skin/.mcp` | `checkAssembly`/`checkAssemblyData`/`skinGaps` вызываются агентом на реальных данных |
| Живой прогон против службы раздачи | `createPresetsSkinSource`/`createPresetsClient` — CRUD по всем четырём видам, различение «легла»/«отказала» |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Съёмный слой этого движка — `./solid`: реактивная обвязка над `SkinSwitch`, которую движок сам
не носит в себе и не требует. Без Solid механика работает целиком — надевание, проверка порядка,
порождение CSS не знают о фреймворке ни строкой.

```tsx
import { createSkinConnection } from "@web-core/skin/solid";

function ThemeSwitch() {
  const skin = createSkinConnection(source, { fallback: { skin: "brutal", mode: "light" } });
  onMount(() => void skin.restore());

  return (
    <button onClick={() => skin.setMode(skin.worn()?.mode === "dark" ? "light" : "dark")}>
      {skin.worn()?.mode ?? "без скина"}
    </button>
  );
}
```
