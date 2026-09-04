# @web-core/lint

Пресет ESLint поверх [`eslint-plugin-solid`][plugin]: **канон Solid, выраженный машиной**.

Абзац документации говорит «так лучше». Правило линтера говорит «так нельзя, и вот
проверка». Зона существует ради второй формы: у канона, который нельзя прогнать, нет
способа узнать, что он перестал соблюдаться.

Контракт зон целиком — `PROBEWEB-4`; он ведётся architect'ом, эта страница его не
заменяет, а пересказывает со стороны пакета.

## Одна точка наружу

```ts
import { defineConfig } from "@web-core/lint";
```

Весь `eslint.config.js` потребителя:

```js
import { defineConfig } from "@web-core/lint";

export default defineConfig();
```

`defineConfig()` возвращает **массив** flat-конфигов — так пресет разворачивается в чужой
конфиг спредом и может вырасти в новые секции, не меняя вызов:

```js
import { defineConfig } from "@web-core/lint";

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

Область по расширениям (`.ts`, `.mts`, `.cts`, `.tsx`, `.jsx`, `.mjsx`, `.cjsx`) —
**часть контракта пресета, а не настройка**: на ней завязан разбор. Нужно уже — своя секция
ниже по массиву переопределяет что угодно.

Рядом отдаются сами карты правил — `rules`, `canonRules`, `companionRules`, `offRules`, —
чтобы можно было собрать свой конфиг вокруг того же канона, не переписывая его руками.

## Что включено и почему

Уровень у всего включённого один — `error`. Почему именно так — [ниже](#уровень--error-без-ручки-понизить).

### Канон — четыре несущих правила

Они названы в контракте зон и обязаны быть включены.

| правило | что ловит | почему это дефект, а не вкус |
|---|---|---|
| [`solid/reactivity`][r-reactivity] | чтение реактивного (`props`, сигнал, мемо) вне отслеживаемой области | «changes will be ignored» — значение застывает на первом рендере, и это **молчаливая** поломка: ошибки нет, вид просто не обновляется |
| [`solid/no-destructure`][r-no-destructure] | деструктуризацию `props` в списке параметров | реактивность держится на доступе через свойство (`props.foo`); деструктуризация читает значение один раз и рвёт связь с источником |
| [`solid/no-react-deps`][r-no-react-deps] | массивы зависимостей у `createEffect`/`createMemo` | перенос привычки из React: в Solid зависимости собираются автоматически, а массив создаёт ложное впечатление, что чем-то управляешь |
| [`solid/components-return-once`][r-components-return-once] | ранние `return` в компоненте | тело компонента исполняется **один раз**, поэтому условие обязано быть внутри JSX (`<Show />`, фрагмент), а не перед ним |

### Сопутствующие — те же грабли частными случаями

| правило | что ловит |
|---|---|
| [`solid/event-handlers`][r-event-handlers] | двусмысленные имена обработчиков (`onclick` против `onClick`): привязка на нативном элементе не реактивна, как прочие JSX-props, и имя решает, как она сработает |
| [`solid/imports`][r-imports] | импорт не из того входа `solid-js` (`solid-js/web`, `solid-js/store`) — программа выглядит рабочей и ведёт себя иначе |
| [`solid/jsx-no-duplicate-props`][r-jsx-no-duplicate-props] | повтор одного prop в JSX: побеждает последний, остальные теряются молча |
| [`solid/jsx-no-undef`][r-jsx-no-undef] | необъявленный компонент в JSX; с `typescriptEnabled: true` проверку имён отдаём компилятору, за правилом остаётся то, что он не видит |
| [`solid/jsx-uses-vars`][r-jsx-uses-vars] | не диагностика, а подпорка: помечает переменные, использованные только в JSX, как использованные — иначе `no-unused-vars` режет живые компоненты |
| [`solid/jsx-no-script-url`][r-jsx-no-script-url] | `javascript:`-URL в JSX — исполнение строки как кода |
| [`solid/no-innerhtml`][r-no-innerhtml] | `innerHTML` — вставку непроверенной разметки |
| [`solid/no-react-specific-props`][r-no-react-specific-props] | `className`/`htmlFor` — React-props, помеченные устаревшими ещё в Solid v1.4.0 |
| [`solid/prefer-for`][r-prefer-for] | `.map()` в JSX вместо `<For />`: `map` пересоздаёт узлы целиком, `For` держит их по ссылке на элемент — разница в том, что происходит с DOM |
| [`solid/style-prop`][r-style-prop] | `style` строкой и kebab-case свойства: Solid ставит их через `style.setProperty`, форма записи меняет результат |
| [`solid/self-closing-comp`][r-self-closing-comp] | пустой элемент без самозакрытия — единственное здесь стилистическое правило, держится `error`, потому что чинится `--fix` целиком |

### Выключено осознанно

Список существует, чтобы «не включено» отличалось от «не рассмотрено», и сверяется тестом:
каждое правило плагина обязано попасть ровно в одну из трёх карт. Выпуск плагина, принёсший
новое правило, роняет тест — и это его работа, а не помеха.

| правило | почему выключено |
|---|---|
| `solid/no-unknown-namespaces` | пространства имён (`use:`, `prop:`, `attr:`) в TS проверяет компилятор; правило дублировало бы его и ошибалось на директивах потребителя |
| `solid/no-array-handlers` | `onClick={[fn, arg]}` — рабочая форма Solid, а не дефект |
| `solid/prefer-show` | `<Show />` против `&&` — обе формы каноничны, выбор за автором |
| `solid/no-proxy-apis` | нужно только тем, кто целится в окружения без `Proxy` |
| `solid/prefer-classlist` | `classlist` помечен устаревшим в самом Solid — правило зовёт в обратную сторону |

## Известная граница: `no-destructure` видит только параметры

**Правило ловит деструктуризацию `props` ТОЛЬКО в списке параметров.** Дословно из доки
плагина: «This rule only tracks destructuring in the parameter list».

```tsx
// ловится
function Greeting({ name }: { name: string }) {}

// ЭТИМ ПРАВИЛОМ НЕ ЛОВИТСЯ
function Greeting(props: { name: string }) {
  const { name } = props;
}
```

Замер второго случая (2026-08-08, зафиксирован тестом `test/preset.test.ts`): `no-destructure`
молчит, но срабатывает `solid/reactivity` — «The reactive variable 'props' should be used
within JSX, a tracked scope…». То есть дыра **прикрыта соседним правилом, а не закрыта**:
реактивность ловится, потому что деструктуризация в теле компонента это ещё и чтение вне
отслеживаемой области. Формы, где чтение окажется внутри отслеживаемой области, пресет
пропустит.

Граница названа здесь намеренно и подробно: **непроверяемое правило, выданное за
проверяемое, хуже отсутствующего** — на него полагаются, а оно молчит.

## Уровень — `error`, без ручки «понизить»

Upstream-пресет плагина (`solid.configs["flat/typescript"]`, версия 0.14.5, проверено кодом
2026-08-08) держит `reactivity`, `components-return-once`, `no-react-deps` и ещё пять правил
на `warn`. Наш пресет поднимает всё включённое до `error`, и промежуточного уровня не
предлагает.

Причина одна и проверяемая: **`eslint` выходит с кодом 0, пока в отчёте только `warn`.**
Правило на `warn` не роняет ни команду, ни сборку — оно печатает текст, который со временем
перестают читать. Канон, которому верят и который молча не работает, — это ровно то
состояние, из которого зона выросла.

Отсюда линия: **включено ⇒ `error`; правило, из-за которого не стоит ронять сборку, — не
правило, а абзац доки, и его место в списке выключенных.** Настройки «понизить уровень» нет
намеренно: она позволила бы тихо вернуться в исходное состояние в каждом отдельном проекте.
Кому нужно иначе — переопределяет своей секцией ниже по массиву, и это видно в его конфиге.

Решение об уровне — за architect (`PROBEWEB-4`); здесь описано то, что пресет делает
сегодня, и почему предложено именно так.

## Разбор — Babel, а не `@typescript-eslint/parser`

Пресет **не зависит от TypeScript** — ни обычной зависимостью, ни peer. Разбор синтаксиса
делает `@babel/eslint-parser`.

Причина, названная рынком прямым текстом: `@typescript-eslint/parser@8.66.0` (последний
выпуск на 2026-08-08) при старте бросает

> typescript-eslint does not support TS 7.0.

и предлагает держать рядом TS 6 — проверено на этом пакете 2026-08-08; продукт стоит на TS
7.0.2. Поддержка TS 7 у них открытым вопросом (`typescript-eslint#10940`, последнее движение
2026-07-09). Вторая копия компилятора ради линтера — подпорка, а не решение.

Причина глубже версий: **линтеру здесь не нужны типы.** Ни одно правило `eslint-plugin-solid`
не спрашивает тип у компилятора — им хватает синтаксиса. Babel разбирает TS и JSX как
синтаксис, компилятор для этого не нужен вовсе, поэтому пресет не может сломаться от смены
версии TypeScript. Плагин держит оба парсера: его тестовая матрица гоняет и babel, и ts
(`PARSER=all`).

Практические следствия, которые стоит знать:

- **тип-зависимых правил в пресете нет и не будет** без отдельного решения: `parserOptions.project`
  не включается, полного прогона компилятора на каждый запуск не происходит;
- **`.ts` разбирается без плагина `jsx`** — иначе угловой каст `<string>value` (законный TS)
  читался бы как JSX-элемент и давал ложную ошибку парсера. Поэтому секции разбора две:
  для `.ts`-семейства и для файлов с JSX. Ложная ошибка хуже пропущенной;
- плагины парсера перечислены явным `parserOpts.plugins`, а не пресетом
  `@babel/preset-typescript`: `@babel/eslint-parser@8` собирает список ровно оттуда, пресеты
  в него не разворачиваются (проверено 2026-08-08 — с пресетом файл падает уже на
  `import { type JSX }`).

## Зависимости

| что | как объявлено | почему |
|---|---|---|
| `eslint` | **peer** `^9.0.0 \|\| ^10.0.0` | команду запускает потребитель, и движок обязан быть один: две копии дают «плагин не найден» на ровном месте |
| `eslint-plugin-solid` | обычная | его зовём мы, потребитель про него не знает |
| `@babel/core`, `@babel/eslint-parser` | обычные | то же: разбор — наша внутренность, и подменить её выпуском мы должны без правки чужих файлов |
| `solid-js` | **не объявлен** | норма фонда «`solid-js` в peer» относится к пакетам, которые его импортируют; пресет не выполняет код Solid и в дерево приложения не попадает вовсе |

**Известное расхождение диапазонов.** `eslint-plugin-solid@0.14.5` объявляет peer
`eslint: ^6 || ^7 || ^8 || ^9` — десятки в списке нет, потому что выпуск плагина от
2024-12-11 старше её. Под ESLint 10.8.1 плагин проверен и работает (весь набор правил,
2026-08-08 — это и есть предмет тестов пакета). Менеджер пакетов на установке предупредит о
неудовлетворённом peer; предупреждение ожидаемое, ставить ESLint 9 ради его тишины не нужно.

## Разработка

```sh
pnpm install     # ставит и пакет, и проект-потребитель (рабочее пространство); собирает пресет
pnpm run build   # tsc → dist
pnpm run lint    # проверка типов пакета и тестов
pnpm test        # сборка + все проверки
```

### Пресет собирается на установке

У пакета объявлен жизненный цикл `prepare` (`pnpm run build`), и менеджер зовёт его для
пакетов рабочего пространства при `pnpm install`. Поэтому на свежем клоне линт проходит
**без отдельной команды сборки**.

Причина не в удобстве. `eslint.config.js` потребителя импортирует пресет, и конфиг грузит
Node напрямую — Vite в этой цепочке нет вовсе, подменить путь на исходники некому. Без
собранного `dist` команда падает не диагностикой, а отказом резолвера:

```
ERR_MODULE_NOT_FOUND  @web-core/lint/dist/index.js
```

Инструмент, которым проверяют, не может проверяться собой во время собственной загрузки —
он обязан существовать раньше. `prepare` есть только у оснастки (здесь и в пакете сборки);
остальные пакеты видны через исходники и на установке не собираются.

Замер натурный, 2026-08-19: чистый клон → `pnpm install` → `eslint` у эталона и у зоны
примитивов проходит начисто; удалить `dist` пресета в том же клоне — тот самый отказ выше.

Машинного pre-commit в репозитории нет — каденс `этап → проверка → коммит` держится на
агенте: `build` + `lint` + `test` руками перед каждым коммитом.

### Что проверяют тесты

Пресет без фикстур не гарантирует ничего: «правило включено в конфиге» и «нарушение
поймано» — разные утверждения.

- `test/preset.test.ts` — **фикстуры**. `test/fixtures/violation/*` — заведомо нарушающий
  код, каждый файл обязан дать своё правило и уровень `error`; `test/fixtures/canon/*` —
  заведомо каноничный, обязан пройти начисто; `test/fixtures/limit/*` — названная граница
  `no-destructure`, зафиксированная замером. Здесь же сверяется состав пресета: каждое
  правило плагина рассмотрено, промежуточных уровней нет.
- `test/consumer.test.ts` — **чистый проект**: отдельный `package.json`, свой
  `eslint.config.js`, своя копия ESLint, пакет подключён установленным (`workspace:*`).
  Зовётся CLI, а не Node-API, потому что код возврата — часть контракта: при `warn` команда
  вышла бы с нулём.
- `test/prepare.test.ts` — **сборка на установке**: копия зоны без `dist`, в ней зовётся
  `prepare`, и каждая цель `exports` обязана появиться на диске. Проверяется наша часть —
  что скрипт объявлен и что он строит пакет с нуля; «менеджер зовёт `prepare` на установке»
  это свойство менеджера, оно замерено натурально, а не тестом.
- `test/surface.test.ts` — `pnpm pack` и разбор тарбола перечнем: одна точка наружу, цель
  `exports` реально лежит внутри, исходники и тесты потребителю не едут, на `typescript`
  пакет не завязан ничем.

## Версия и публикация

Версию поднимает **architect при публикации**, не владелец зоны в коммите. Реестр — GitHub
Packages (`PROBEWEB-4`).

[plugin]: https://github.com/solidjs-community/eslint-plugin-solid
[r-reactivity]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/reactivity.md
[r-no-destructure]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-destructure.md
[r-no-react-deps]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-react-deps.md
[r-components-return-once]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/components-return-once.md
[r-event-handlers]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/event-handlers.md
[r-imports]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/imports.md
[r-jsx-no-duplicate-props]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-no-duplicate-props.md
[r-jsx-no-undef]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-no-undef.md
[r-jsx-uses-vars]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-uses-vars.md
[r-jsx-no-script-url]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/jsx-no-script-url.md
[r-no-innerhtml]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-innerhtml.md
[r-no-react-specific-props]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/no-react-specific-props.md
[r-prefer-for]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/prefer-for.md
[r-style-prop]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/style-prop.md
[r-self-closing-comp]: https://github.com/solidjs-community/eslint-plugin-solid/blob/main/packages/eslint-plugin-solid/docs/self-closing-comp.md
