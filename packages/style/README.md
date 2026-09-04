# 🎨 web-core Style

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

🏷️ style · 🧬 engine · 📦 `@web-core/style`

⚙️ Движок стилей web-core: **ядро без фреймворка** — токен-контракт, шкалы, роли, порождение
CSS — плюс **Solid-обвес** (`cn`, `createStyle`, реэкспорт `cva`) отдельным подпутём. Ядро —
один из поставщиков значений, а не фундамент: оформление вправе взять значения у нас, взять у
кого-то ещё или обойтись своими, взять обвес или не брать вовсе — и остаться законным. 🧪 Скин,
написанный без единого нашего экспорта, обязан проходить все проверки.

🧩 Обвес и ядро были двумя разными пакетами (`@web-core/style` и `@web-core/style-tools`) —
слиты в один движок с разными подпутями под разные экспорты (разбор — `FAQ.md`). Появится обвес
под другой фреймворк (React) — ляжет рядом своим подпутём, а не сюда.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ По образцу `packages/store`: `src/index.ts` — тонкая поверхность (`export * from "./engine/index.js"`), сама логика и сам перечень поверхности — в `src/engine/`. Дальше разрез
расходится по назначению, не по фреймворку: `engine/` не знает ни CSS-печати, ни Solid; `css/`
знает печать, но не Solid; `solid/` — обвес поверх ядра для конкретного фреймворка, у store
эта роль — `machine/`.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Ядро (значения) | `@web-core/style` | `buildScale`, `buildAlphaScale`, `buildChartScale`, `buildScrim`, `AXES`, `axisOf`, `CONTRAST_PROMISES`, `NO_PROMISE`, `SCALE_STEPS`, `STEP_PURPOSE`, `STEP_PURPOSE_CLASS`, `DERIVED_SCALES`, `DERIVED_TOKENS`, `FIXED_TOKENS`, `GRID_STEP`, `GRID_NOTE`, `ROUND_SUPPORT_TEST`, `ROUND_FALLBACK_NOTE`, `DENSITY_TOKEN`, `DENSITY_DEFAULT`, `DENSITY_FLOOR`, `DENSITY_CEILING`, `DENSITY_NOTE`, `SPACE_ROLES`, `LAYERS`, `LAYER_TOKENS`, `BASE_MARKER`, `contrastRatio`, `AA_TEXT`, `AA_NON_TEXT`, `parseColor`, `tryParseColor`, `formatOklch`, `oklchToSrgb`, `srgbToOklch`, `inSrgbGamut`, `toSrgbGamut`, `NAMED_COLORS`, `NAMED_COLOR_COUNT` + типы (`Axis`, `AxisBound`, `BoundKind`, `ScaleMode`, `ScaleKey`, `ScaleStep`, `ScaleValues`, `AlphaKey`, `AlphaValues`, `ContrastPromise`, `StepPurposeClass`, `DerivedScale`, `DerivedStep`, `SpaceRole`, `SpaceRoleEntry`, `Layer`, `BaseMarker`, `Oklch`, `Srgb`, `ColorRefusal`, `ParsedColor`) |
| Порождение CSS | `@web-core/style/generate` | `baseCss()` — чистая функция, из которой берётся файл ниже |
| Готовый сброс | `@web-core/style/base.css` | CSS: **только сброс** — `box-sizing`, `margin`, `appearance: none` на кнопках, ни одного кастом-свойства |
| Solid-обвес | `@web-core/style/solid` | `cn`, `createStyle`, `type VariantFn`, реэкспорт `cva`, `type VariantProps` |

📦 Внутри `src/`: `index.ts` (поверхность), `engine/index.ts` (перечень + логика ядра:
`axes.ts`, `dimension.ts`, `layer.ts`, `marker.ts`, `scale.ts`, `trace.ts`, `color/*` —
framework-free), `css/` (`generate.ts`, `written.ts` — порождение и ручная часть листа,
тоже framework-free), `solid/` (`cn.ts`, `create-style.ts`, `index.ts` — обвес, `solid-js`
опциональный peer). `dist/index.d.ts` после сборки — один реэкспорт, все типы протянуты
насквозь.

CSS через корневой вход и через `/solid` НЕ идёт: манифест объявляет `sideEffects: false`.
Стили едут подпутём `/base.css`, порождение — `/generate`.

<h2 id="использование">🚀 Использование</h2>

✅ Пять сценариев покрывают всё, чем реально пишется код с этим движком: смена бренда одним
семенем, готовый сброс, порождение CSS по требованию, гейт контраста и Solid-обвес.

**Значения — смена бренда одним семенем:**

```ts
import { buildScale } from "@web-core/style";

const half = buildScale("#0f6fde", "dark"); // одно семя → вся половина шкалы
```

**Готовый сброс:**

```ts
import "@web-core/style/base.css"; // box-sizing, margin, appearance: none — и больше ничего
```

**Порождение CSS по требованию** (дев-сервер, сборочный сценарий):

```ts
import { baseCss } from "@web-core/style/generate";

await writeFile("base.css", baseCss());
```

**Гейт контраста** — доступен потребителю, а не спрятан внутри:

```ts
import { AA_TEXT, contrastRatio } from "@web-core/style";

contrastRatio(fg, bg) >= AA_TEXT; // та же формула, которой проверяем мы
```

**Solid-обвес — `cn` и `createStyle` с `cva`:**

```tsx
import { cn, createStyle, cva } from "@web-core/style/solid";

const button = cva("inline-flex p-2", {
  variants: { size: { sm: "text-sm", lg: "text-lg p-4" } },
  defaultVariants: { size: "sm" },
});

function Button(props: { size?: "sm" | "lg"; class?: string }) {
  const cls = createStyle(button, props);
  return <button class={cls()}>…</button>;
}

cn("p-2", "p-4"); // → "p-4" — конфликт утилит разрешается
```

<h2 id="настройки">🎚️ Настройки</h2>

🔧 Настроек-переключателей у ядра нет — оно даёт данные (границы осей, цену ступеней) и чистые
функции построения. Таблица — реально объявленные границы (`AXES` из `src/engine/axes.ts`) и
именованные опции Solid-обвеса.

| Ось / опция | Где | Пол | Потолок |
|---|---|---|---|
| `--density` | `AXES` | `0.75` — **норма** (WCAG 2.2, 2.5.8) | `1.5` — предел поддержки |
| `--control-height` | `AXES` | `1.875rem` — **норма** (2.5.8) | границы нет |
| `--radius` | `AXES` | границы нет | практический предел (пилюля) |
| `--font-size` · `--space` · `--column` · `--border-width` · `--tracking` | `AXES` | границы нет | границы нет |

| Опция | Где | Тип | По умолчанию |
|---|---|---|---|
| `class` | `createStyle`, `props.class` | `string \| undefined` | — (последний аргумент `cn`, побеждает вариант) |
| `variants` | `createStyle`, 1-й аргумент | `VariantFn<P>` (обычно `cva()`) | обязательное |
| `mode` | `buildScale`/`buildAlphaScale`/`buildChartScale`/`buildScrim` | `"light" \| "dark"` | обязательное |

🏷️ `kind` у каждой границы — `"норма" \| "предел поддержки" \| "практический предел" \| "границы нет"`; только у `"норма"` заполнено поле `norm` со ссылкой на критерий. Разбор — FAQ.md.

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Ни одно из состояний ниже не придумано этим README — каждое ловится настоящей проверкой в
рантайме (тип-объединением или полем `kind`), а не документируется как пожелание.

| Состояние | Метка | Где |
|---|---|---|
| Цвет разобран | `{ ok: true, color: Oklch }` | `ParsedColor`, `parseColor`/`tryParseColor` |
| Цвет отвергнут: нотация неизвестна | `{ ok: false, refusal: "unknown-notation" }` | `ParsedColor` |
| Цвет отвергнут: полупрозрачный | `{ ok: false, refusal: "translucent" }` | `ParsedColor` — семя шкалы обязано быть непрозрачным |
| Граница оси — норма доступности | `kind: "норма"`, поле `norm` заполнено | `AxisBound`, `axisOf` |
| Граница оси — предел поддержки | `kind: "предел поддержки"` | `AxisBound` |
| Граница оси — практический предел | `kind: "практический предел"` | `AxisBound` (скругление) |
| Граница оси не существует | `kind: "границы нет"`, `value: null` | `AxisBound` |
| Ступень красит заливку/границу | `STEP_PURPOSE_CLASS[key] === "fill"` | ступени 1–10 |
| Ступень красит текст/иконку | `STEP_PURPOSE_CLASS[key] === "ink"` | ступени 11, 12, `contrast` |
| Контраст не обещан | ступень входит в `NO_PROMISE` | 1–5 (фоны), 6–7 (оформление), 9–10 (верность бренду) |

<h2 id="io">🔌 IO</h2>

🔌 Ядро строит значения из семени и разбирает цвет; обвес собирает класс из вариантов. Разных
задач — разные формы входа и выхода, общего конверта между ними нет и не должно быть.

<h3>📥 Вход</h3>

| Функция | Принимает |
|---|---|
| `buildScale(seed, mode)` | `seed: string` (любой разбираемый цвет), `mode: ScaleMode` |
| `buildAlphaScale(seed, mode)` | то же — параллельный альфа-ряд той же шкалы |
| `buildChartScale(seed, mode)` | семя бренда → `CHART_SLOTS` (5) категориальных цветов |
| `buildScrim(mode)` | режим → сила перекрытия затемнения под модальным слоем |
| `parseColor(input)` | строка CSS-цвета; бросает `Error` на отказ |
| `tryParseColor(input)` | то же, не бросает — отдаёт `ParsedColor` с `refusal` |
| `contrastRatio(fg, bg)` | два `Oklch` |
| `axisOf(name)` | имя оси → `Axis \| undefined` |
| `createStyle(variants, props)` | вариант-функция + пропсы (`class` не попадает в `variants`) |
| `cn(...inputs)` | `ClassValue[]` (строки, массивы, объекты, ложные значения) |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `buildScale` | `ScaleValues` — 12 ступеней + `contrast` |
| `buildAlphaScale` | `AlphaValues` — `a1…a12` |
| `parseColor`/`tryParseColor` | `Oklch` либо `ParsedColor` с `refusal` |
| `contrastRatio` | `number` — отношение по WCAG |
| `axisOf` | `Axis` — `{ floor: AxisBound, ceiling: AxisBound, continuous: true }` |
| `createStyle` | `Accessor<string>` — реактивный класс |
| `cn` | `string` — класс после разрешения конфликтов |

<h2 id="сборки">🏗️ Сборки</h2>

🏗️ Показаны только композиции, реально прогнанные тестом — не теоретические примеры
использования.

| Сборка | Что доказывает | Файл |
|---|---|---|
| `SPACE_ROLES` + `DERIVED_SCALES` | каждая роль отступа называет реально существующую ступень шкалы `space`, и у каждой роли есть `means` для человека | `test/spacing-roles.test.ts` |
| `createStyle` + `cva` | варианты и дефолты применяются, конфликт утилит разрешается, `class` идёт последним и не удваивается, реактивность доходит до варианта и до `class`, принимает рукописную вариант-функцию | `test/solid/create-style.test.ts` |
| `cn` (`clsx` + `tailwind-merge`) | конфликт групп разрешается по правому аргументу, неконфликтующие утилиты остаются обе, модификаторы состояний не конфликтуют с базой, произвольные классы проходят насквозь | `test/solid/cn.test.ts` |

⚠️ Прежний гейт зоны (`axes`/`dimension`/`scale`/`color`/`base-css`/`marker`/`mode`/`pack`/
`types`/`entries`/`generate` — мутационно проверенный, ~20 файлов) снят целиком отдельной
осознанной правкой, а не потерян по недосмотру, и на сегодня не переписан. Данные и функции,
которые он проверял, на месте и не менялись этой правкой — но голословных «держит проба X» в
этом README больше нет: не проверено сегодня, значит не заявлено. Статус — `ROADMAP.yaml`.

<h2 id="рецепт">🎨 Рецепт</h2>

🎨 Съёмный слой этого движка — Solid-обвес: не встроен в ядро, а живёт отдельным подпутём и
подключается собственным импортом, без единой строки зависимости в обратную сторону.

```ts
// Ядро — framework-free, значения и CSS
import { buildScale } from "@web-core/style";
import "@web-core/style/base.css";

const half = buildScale("#0f6fde", "dark");
```

```tsx
// Обвес — только там, где реально нужна реактивная сборка класса
import { cn, createStyle, cva } from "@web-core/style/solid";

const button = cva("inline-flex", { variants: { size: { sm: "text-sm", lg: "text-lg" } } });

function Button(props: { size?: "sm" | "lg"; class?: string }) {
  return <button class={createStyle(button, props)()}>…</button>;
}
```

🔓 Приложение, которому обвес не нужен (не Solid, или своя обвязка), ставит только ядро —
`solid-js` объявлен `peerDependenciesMeta.optional: true` и не приезжает без импорта `/solid`.
