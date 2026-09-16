# 🛡️ web-core Lint

🏷️ quality · 🧬 engine · 📦 `@web-core/lint`

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

🛡️ Машинный контроль кода — используйте, если зоне нужна проверка «так нельзя», а не абзац доки
«так лучше». 🧬 Устроен тем же приёмом, что `@web-core/style`/`@web-core/trace` — **ядро без
движка проверки** (список правил как данные: `id` + обязательность + описание, независимо от
того, ЧЕМ это будет проверено) плюс **плагин конкретного движка** отдельным подпутём.

Пакет держит ДВА независимых канона, не один:

- **Solid-реактивность** (`.` — ядро, `./eslint` — движок поверх `eslint-plugin-solid`). Как
  было изначально: реактивность/деструктуризация/JSX, специфичные для Solid.
- **Кодстиль/импорты** (`./style` — ядро, `./biome` — движок поверх Biome). Добавлено
  2026-09-15 — повод и разбор, почему это НЕ второй движок для того же Solid-канона, а свой
  список правил, см. `ROADMAP.yaml` (`biome-for-style-not-reactivity`).

Каноны не смешиваются в одну карту — у них разные движки и разный повод существования; общий
только приём (ядро как данные, независимо от того, чем проверено).

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Канон Solid (ядро) | `@web-core/lint` | `rules`, `canonRules`, `companionRules`, `offRules`, тип `CanonRule` |
| ESLint-плагин | `@web-core/lint/eslint` | `defineConfig(options)`, `rules`, `canonRules`, `companionRules`, `offRules` (ESLint-запись) |
| Канон кодстиля (ядро) | `@web-core/lint/style` | `rules`, тип `StyleCanonRule` |
| Biome-плагин | `@web-core/lint/biome` | `defineBiomeConfig()`, тип `BiomeConfig` |
| Готовый `biome.json` | `@web-core/lint/biome.json` | статический JSON — результат `defineBiomeConfig()`, не функция |

📂 `src/engine/index.ts` — только тип канона: `CanonRule` (`id`, `severity: "required" \| "off"`,
`summary`), `CanonSeverity`, ноль зависимостей, ни слова про Solid или ESLint. `src/solid/index.ts`
— сама Solid-данность: массивы `canonRules`/`companionRules`/`offRules`/`rules` (`CanonRule[]`),
единственное место, где живёт список конкретных правил `eslint-plugin-solid` в терминах канона.
`src/index.ts` — тонкий барель (`export * from "./engine/index.js"; export * from
"./solid/index.js"`), тот же приём, что у `@web-core/trace`/`@web-core/style`.
`src/eslint/index.ts` — единственное место пакета, которое трогает `eslint`/`eslint-plugin-solid`/
`@babel/*`: переводит `id` канона в реальное имя правила (`solid/<id>`), собирает три секции
flat-конфига (правила + два парсера — `.ts` и `.tsx` раздельно, см. FAQ.md).

📂 `src/style/index.ts` — канон кодстиля: массив `StyleCanonRule` (`formatting`,
`organized-imports`), свой тип, не переиспользует `CanonRule` — независимость от Solid-канона
дословная, не только по списку. `src/biome/index.ts` — переводит канон в объект `BiomeConfig`
(`formatter`+`assist.actions.source.organizeImports`, `linter.enabled: false` явно). Biome, в
отличие от ESLint, не умеет исполняемый конфиг — читает только статический JSON, поэтому
`defineBiomeConfig()` не тот артефакт, который подключает потребитель: `scripts/generate-biome-json.mjs`
материализует его в `dist/biome/biome.json` на шаге `build`, и это единственный файл, на который
реально ссылается `extends` в чужом `biome.json` (см. FAQ.md, «Кодстиль/Biome»).

<h2 id="использование">🚀 Использование</h2>

**Плагин ESLint** — весь `eslint.config.js` потребителя:

```js
import { defineConfig } from "@web-core/lint/eslint";

export default defineConfig();
```

Разворачивается в чужой конфиг спредом — можно дописать своё вокруг:

```js
import { defineConfig } from "@web-core/lint/eslint";

export default [
  { ignores: ["dist/**"] },
  ...defineConfig(),
  { rules: { "solid/prefer-show": "error" } }, // своё — секцией ниже, она побеждает
];
```

Единственная настройка — `ignores`:

```js
defineConfig({ ignores: ["**/legacy/**"] });
```

**Канон напрямую** — своя реализация движка или свой кастомный конфиг ESLint вокруг того же
канона:

```ts
import { rules } from "@web-core/lint";

for (const rule of rules) {
  console.log(rule.id, rule.severity, rule.summary);
}
```

**Biome-канон** — `biome.json` потребителя подключает готовый статический артефакт через
`extends` (Biome не умеет исполняемый конфиг, импорт функции в JSON не работает). Адрес —
подпуть `exports` пакета, не путь до файла в `node_modules` (тот хрупкий: зависит от глубины
вложенности и хоистинга):

```jsonc
// biome.json потребителя
{ "extends": ["@web-core/lint/biome.json"] }
```

`defineBiomeConfig()` из `@web-core/lint/biome` — то, из чего этот файл материализуется
(`scripts/generate-biome-json.mjs` пакета), не то, что подключает потребитель напрямую.

<h2 id="настройки">🎚️ Настройки</h2>

🎚️ У обоих канонов настроек нет — они данные. У ESLint-плагина одна, у Biome-плагина нет вовсе
(`defineBiomeConfig()` без аргументов — весь выбор уже сделан движком, см. FAQ.md).

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `ignores` | `defineConfig(options)` (`./eslint`) | `readonly string[]` | не задан |

<h2 id="состояния">🎛️ Состояния</h2>

🩺 У обоих канонов нет состояний — статичные данные. У ESLint-плагина одно ветвление: файл с JSX
или без — от этого зависит, какой парсер применяется (см. FAQ.md, «Разбор — Babel»). У
Biome-плагина состояний нет — весь выбор зафиксирован в движке, ветвления по входу нет.

| Состояние | Метка | Где |
|---|---|---|
| Файл без JSX (`.ts`/`.mts`/`.cts`) | секция `parser-ts`, `parserOpts.plugins: ["typescript"]` | `src/eslint/index.ts` |
| Файл с JSX (`.tsx`/`.jsx`/…) | секция `parser-jsx`, `parserOpts.plugins: ["typescript", "jsx"]` | `src/eslint/index.ts` |
| Правило канона `severity: "off"` | ESLint-уровень `"off"` | `src/eslint/index.ts`, `toEslintRules` |
| Правило канона `severity: "required"` | ESLint-уровень `"error"`, без промежуточного `"warn"` | `src/eslint/index.ts`, `toEslintRules` |
| Отступ Biome-движка | `indentStyle: "space"`, `indentWidth: 2` — явно, не дефолт Biome (без поля — TABS) | `src/biome/index.ts` |
| Линтер Biome-движка | `linter.enabled: false` — явно, не дефолт Biome (без поля — `recommended`-набор) | `src/biome/index.ts` |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Функция | Принимает |
|---|---|
| `defineConfig(options?)` | `PresetOptions` (`ignores?: readonly string[]`) |
| `defineBiomeConfig()` | ничего — без аргументов |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `rules`/`canonRules`/`companionRules`/`offRules` (`.`) | `readonly CanonRule[]` — данные, не конфиг |
| `rules`/`canonRules`/`companionRules`/`offRules` (`./eslint`) | `Linter.RulesRecord` — та же карта, переведённая в ESLint-запись |
| `defineConfig()` | `Linter.Config[]` — массив flat-конфигов для `export default` в `eslint.config.js` |
| `rules` (`./style`) | `readonly StyleCanonRule[]` — данные, не конфиг |
| `defineBiomeConfig()` (`./biome`) | `BiomeConfig` — объект, источник для `dist/biome/biome.json`, не сам конфиг |
| `@web-core/lint/biome.json` | статический JSON — то, на что реально ссылается `extends` потребителя |

<h2 id="сборки">🏗️ Сборки</h2>

⚠️ Историческая проба (`test/preset.test.ts`, `test/consumer.test.ts`, `test/prepare.test.ts`,
`test/surface.test.ts`), которая проверяла Solid-канон/ESLint-плагин, была снесена коммитом
`f807343` («replaced by apps/panel») вместе с тестами `packages/build` и до сих пор не
восстановлена (открытый пункт `ROADMAP.yaml`, `id: rebuild-test-suite`) — то, что проверено ниже
для Solid/ESLint, сделано вручную, не автоматикой.

Канон кодстиля/Biome — младше и покрыт `vitest` с рождения: `test/style.test.ts`,
`test/biome.test.ts` (`pnpm run test`), второй гоняет настоящий бинарь `biome` из
`node_modules/.bin`, не мок.

| Проверено | Как | Результат |
|---|---|---|
| Перевод канона в ESLint не потерял и не изменил ни одного правила | `defineConfig()` из собранного `dist/`, сверка с прежней плоской картой | 20 правил, те же уровни, `jsx-no-undef` с той же опцией |
| Плагин реально ловит нарушение | `eslint` на файле с деструктурированными `props` | `solid/reactivity` — `error`, как и раньше |
| Настоящий потребитель проходит чисто | `pnpm run lint` в `packages/ui` (главный потребитель пресета в ките) | зелёный: `eslint . && tsc --noEmit` |
| 12 потребителей переведены на новый подпуть | `grep` по всем `eslint.config.js` кита | везде `@web-core/lint/eslint`, старого `@web-core/lint` (голого) не осталось |
| `defineBiomeConfig()` держит явный отступ, не дефолт Biome | `biome check --write` без поля `indentStyle` на 2-пробельной фикстуре | молча переезжает на TABS — отсюда явные `indentStyle`/`indentWidth` в движке |
| Сгенерированный `biome.json` реально сортирует импорты и не трогает неиспользуемые переменные | `test/biome.test.ts`: настоящий `biome check --write` на фикстуре | импорты отсортированы, 2 пробела, `noUnusedVariables` не сработал — линтер выключен на практике |

<h2 id="рецепт">🎨 Рецепт</h2>

🔌 Рецепт канона — реализация конкретным движком: свой файл, свой перевод `id` → правило
движка, канон как единственный источник правды о том, что вообще проверяется. Сегодня две пары,
не одна — `./eslint` поверх Solid-канона и `./biome` поверх канона кодстиля:

```ts
// src/biome/index.ts — реализовано
import { rules as styleCanon } from "../style/index.js";

export function defineBiomeConfig(): BiomeConfig {
  // тот же styleCanon.rules, перевод id → секция biome.json
}
```

⚠️ Отличие от `./eslint`: Biome не умеет исполняемый конфиг — `defineBiomeConfig()` не то, что
подключает потребитель, а источник, из которого шаг `build` (`scripts/generate-biome-json.mjs`)
материализует статический `dist/biome/biome.json`. Реальный потребитель ссылается на этот файл
через `extends`, не импортирует функцию.

📌 Открыто: ни один потребитель в ките пока не подключил `./biome` через `extends` (в отличие от
12 потребителей `./eslint`) — `ROADMAP.yaml`, `id: biome-plugin-first-consumer`.
