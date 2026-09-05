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

🛡️ Канон Solid, выраженный машиной — используйте, если зоне нужна проверка «так нельзя», а не
абзац доки «так лучше». 🧬 Устроен тем же приёмом, что `@web-core/style`/`@web-core/trace` —
**ядро без движка проверки** (`.`, список правил как данные: `id` + обязательность + описание,
независимо от того, ЧЕМ это будет проверено) плюс **плагин конкретного линтера** отдельным
подпутём (`./eslint` — сегодняшняя и пока единственная реализация). 🔮 Форма выбрана заранее ради
следующего шага: когда встанет Biome, канон не переписывается — рядом с `./eslint` встаёт
`./biome`, тот же список правил, другой перевод в конфиг.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM — «часть» здесь означает подпуть поставки, а «адрес» — импорт-спецификатор.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Канон (ядро) | `@web-core/lint` | `rules`, `canonRules`, `companionRules`, `offRules`, тип `CanonRule` |
| ESLint-плагин | `@web-core/lint/eslint` | `defineConfig(options)`, `rules`, `canonRules`, `companionRules`, `offRules` (ESLint-запись) |

📂 `src/engine/index.ts` — канон: массивы `CanonRule` (`id`, `severity: "required" \| "off"`,
`summary`), ноль зависимостей, ни слова про ESLint. `src/index.ts` — тонкий барель
(`export * from "./engine/index.js"`), тот же приём, что у `@web-core/trace`/`@web-core/style`.
`src/eslint/index.ts` — единственное место пакета, которое трогает `eslint`/`eslint-plugin-solid`/
`@babel/*`: переводит `id` канона в реальное имя правила (`solid/<id>`), собирает три секции
flat-конфига (правила + два парсера — `.ts` и `.tsx` раздельно, см. FAQ.md).

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

**Канон напрямую** — своя реализация плагина (например, для будущего `./biome`) или свой
кастомный конфиг ESLint вокруг того же канона:

```ts
import { rules } from "@web-core/lint";

for (const rule of rules) {
  console.log(rule.id, rule.severity, rule.summary);
}
```

<h2 id="настройки">🎚️ Настройки</h2>

🎚️ У канона настроек нет — он данные. У ESLint-плагина одна.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `ignores` | `defineConfig(options)` | `readonly string[]` | не задан |

<h2 id="состояния">🎛️ Состояния</h2>

🩺 У канона нет состояний — статичные данные. У ESLint-плагина одно ветвление: файл с JSX или
без — от этого зависит, какой парсер применяется (см. FAQ.md, «Разбор — Babel»).

| Состояние | Метка | Где |
|---|---|---|
| Файл без JSX (`.ts`/`.mts`/`.cts`) | секция `parser-ts`, `parserOpts.plugins: ["typescript"]` | `src/eslint/index.ts` |
| Файл с JSX (`.tsx`/`.jsx`/…) | секция `parser-jsx`, `parserOpts.plugins: ["typescript", "jsx"]` | `src/eslint/index.ts` |
| Правило канона `severity: "off"` | ESLint-уровень `"off"` | `src/eslint/index.ts`, `toEslintRules` |
| Правило канона `severity: "required"` | ESLint-уровень `"error"`, без промежуточного `"warn"` | `src/eslint/index.ts`, `toEslintRules` |

<h2 id="io">🔌 IO</h2>

<h3>📥 Вход</h3>

| Функция | Принимает |
|---|---|
| `defineConfig(options?)` | `PresetOptions` (`ignores?: readonly string[]`) |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `rules`/`canonRules`/`companionRules`/`offRules` (`.`) | `readonly CanonRule[]` — данные, не конфиг |
| `rules`/`canonRules`/`companionRules`/`offRules` (`./eslint`) | `Linter.RulesRecord` — та же карта, переведённая в ESLint-запись |
| `defineConfig()` | `Linter.Config[]` — массив flat-конфигов для `export default` в `eslint.config.js` |

<h2 id="сборки">🏗️ Сборки</h2>

⚠️ Автоматических проб сегодня нет — `test/`, на который ссылается `vitest.config.ts`, был снесён
коммитом `f807343` («replaced by apps/panel») вместе с тестами `packages/build`, и с тех пор не
восстановлен ни там, ни здесь (открытый пункт `ROADMAP.yaml`, `id: rebuild-test-suite`). Ниже —
что фактически проверено ✅ вручную в рамках этой ревизии.

| Проверено | Как | Результат |
|---|---|---|
| Перевод канона в ESLint не потерял и не изменил ни одного правила | `defineConfig()` из собранного `dist/`, сверка с прежней плоской картой | 20 правил, те же уровни, `jsx-no-undef` с той же опцией |
| Плагин реально ловит нарушение | `eslint` на файле с деструктурированными `props` | `solid/reactivity` — `error`, как и раньше |
| Настоящий потребитель проходит чисто | `pnpm run lint` в `packages/ui` (главный потребитель пресета в ките) | зелёный: `eslint . && tsc --noEmit` |
| 12 потребителей переведены на новый подпуть | `grep` по всем `eslint.config.js` кита | везде `@web-core/lint/eslint`, старого `@web-core/lint` (голого) не осталось |

<h2 id="рецепт">🎨 Рецепт</h2>

🔌 Рецепт канона — реализация конкретным движком. Сегодня один — `./eslint`; форма для второго
(`./biome`, когда придёт время) — та же: свой файл, свой перевод `id` → правило движка, тот же
канон из `../engine/index.js` как единственный источник правды о том, что вообще проверяется.

```ts
// эскиз будущего src/biome/index.ts — не реализовано, форма для примера
import { rules } from "../engine/index.js";

export function defineBiomeConfig() {
  // тот же canon.rules, другой перевод id → biome.json
}
```
