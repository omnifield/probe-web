# ❓ FAQ — грабли, на которые уже наступили

Не документация возможностей (та — в `README.md`) и не план (тот — в `ROADMAP.yaml`). Здесь —
конкретные ловушки TanStack v9 / Solid / skin-механики, которые стоили реального времени при
реализации `base-power`+`filters`. Проверено чтением исходников `@tanstack/table-core`, не
документации — она на момент написания local-first, местами расходится с фактическим поведением.

## TanStack v9 — терминология и устройство

### `start`/`end`, НЕ `left`/`right`

`ColumnPinningState`, `column.getIsPinned()`, `table.getStartLeafHeaders()`/
`getCenterLeafHeaders()`/`getEndLeafHeaders()`, `row.getStartVisibleCells()`/… — вся терминология
v9 логическая (по направлению письма), не физическая. `"left"`/`"right"` — призрак v8, ловится
сразу `tsc`, но не угадывается по интуиции. В recipe это ложится на `insetInlineStart`/
`insetInlineEnd`, не на `left`/`right`.

### `tableFeatures({...})` печётся ОДИН РАЗ, `enableXxx` — настоящий runtime-проп

`tableFeatures({...})` в `components/root.tsx` (переменная `FEATURES`) — печётся в ТИП инстанса при
сборке компонента, не пересобирается per-instance. Всё, что таблица вообще планирует поддержать,
должно попасть туда сразу (см. `log: one-maximal-features-bag` в `ROADMAP.yaml`) — заводить второй
`TableRoot` под другой набор фич не нужно.

`enableRowSelection`/`enableMultiSort`/будущие `enableGrouping` и т.п. — это ДРУГОЕ: настоящие
per-instance runtime-опции `createTable()`, проверено в исходниках. Отсюда и решение — фичи
включаются обычным пропом `TableRoot`, никогда не через `settings` паспорта (см. `log:
features-are-props-not-settings`).

### Row-model факторки живут ВНУТРИ `tableFeatures({...})`, не в опциях `createTable()`

`coreRowModel`, `sortedRowModel`, `filteredRowModel`, `facetedRowModel`, `facetedUniqueValues` —
все регистрируются в самом `FEATURES`-мешке (`tableFeatures({ …, sortedRowModel:
createSortedRowModel(), … })`), рядом с `rowSortingFeature`/`columnFilteringFeature` и т.п. Не
опции, переданные в `createTable()` — там живут только данные/состояние/колбэки. Перепутать легко,
потому что визуально похожи на обычные опции.

### Фильтры: НОЛЬ встроенных функций регистрируется автоматически

В отличие от v8, v9 не тащит ни одной `filterFn` по умолчанию — тришейкинг ради размера бандла.
Даже единственная используемая (`includesString`) должна быть явно зарегистрирована:
`filterFns: { includesString: filterFn_includesString }` внутри `tableFeatures({...})`.

`globalFilteringFeature` и `columnFilteringFeature` СТРУКТУРНО связаны на уровне
`createFilteredRowModel()` — её собственный doc-комментарий требует регистрировать обе фичи вместе,
даже если нужен ТОЛЬКО глобальный поиск. Оба уже в `FEATURES`, трогать не нужно при добавлении
новых фильтрующих фич — только новые `filterFn_*`, если понадобится нестроковый тип значения.

### Фильтр колонки по умолчанию — `filterFn: "auto"`, резолвится по `typeof` значения

Если `columnDef.filterFn` не задан явно, TanStack сам выбирает функцию по типу значения:
`string`→`includesString`, `number`→`inNumberRange`, `boolean`→`equals`, `Array`→`arrIncludes`,
`Date`→`inDateRange`, объект→`equals`, иначе→`weakEquals`. У нас зарегистрирована ТОЛЬКО
`includesString` — этого достаточно для всех текущих (строковых) сценариев `column-filter`. Если
когда-нибудь понадобится диапазон/дата/число как значение фильтра колонки — нужную `filterFn_*`
придётся добавить в `filterFns` явно, иначе `column_getFilterFn` вернёт `undefined`, и
`filterRowsUtils` молча пропустит фильтрацию этой колонки (без ошибки, без предупреждения в
production — только `console.warn` в dev).

### Faceted-значения без `facetedRowModel` — тихо теряют «исключить свой фильтр»

`table.getColumn(id).getFacetedUniqueValues()` требует ОБЕИХ факторок в `FEATURES`:
`facetedRowModel: createFacetedRowModel()` (считает срез строк, исключая фильтр САМОЙ колонки, но
учитывая остальные) и `facetedUniqueValues: createFacetedUniqueValues()` (считает `Map<value,
count>` по этому срезу). Если зарегистрирована только вторая — `column_getFacetedRowModel` тихо
откатывается на `table.getPreFilteredRowModel()` (без исключения своего фильтра), никакой ошибки не
будет, просто список опций схлопнется до текущего фильтра, когда он уже применён.

### `createTable` — стор-бэкед, не `Accessor`-обёртка

Чтение `table.getRowModel()`/`column.getIsSorted()`/… внутри JSX уже участвует в точечной
реактивности Solid без обёртки в лишний `createMemo`/сигнал — собственный doc-комментарий
`createTable` называет это прямо. Не нужно (и вредно по объёму кода) заворачивать чтения `table`
в дополнительные сигналы «по привычке» из других компонентов кита.

## Solid / DOM

### `indeterminate` — свойство DOM, не HTML-атрибут

Ни `indeterminate={...}`, ни `prop:indeterminate={...}` не проходят типизацию Solid JSX для
`<input>` (оба падают на `tsc`). Единственный рабочий путь — `ref` + `createEffect`, выставляющий
`element.indeterminate = …` императивно и реактивно (см. `components/header-select-trigger.tsx`).

## Skin / passport-механика (не специфично для таблицы, но снова подтвердилось)

### `playground/recipe.ts` НИКОГДА не верифицирован сам по себе — всегда гонять `recipe.test.tsx`

Как бы уверенно ни выглядел рецепт, `skinGaps`/`checkSkin` могут найти реальный, ранее никем не
замеченный пробел. Проверялось на каждой фиче этого захода — каждый раз находилось что чинить.
Пустое правило `{ props: {} }` НЕ засчитывается `skinGaps` как покрытие — нужно настоящее (пусть и
визуально нейтральное) значение, например `display: "table-header-group"`.

### `parts.ts` должен буквально совпадать с `passport.ts`

`defineEditorInfo` бросает исключение, если объявленные в `playground/parts.ts` `variables`/
`states` не совпадают ТОЧНО с тем, что реально объявлено в `entity/passport.ts` в рантайме. При
добавлении нового состояния или CSS-переменной (например, `--sort-index`) — синхронизировать оба
файла сразу, а не только паспорт.

### Не изобретать анатомию под фичи без структурного дома

`global-filter`, `column-filter`, faceted-выпадашка, переключатель видимости колонок — ни у одной
нет своей части анатомии. Виджет — дело потребителя, кит отдаёт только состояние/API
(`table.getColumn(id)`, `column.setFilterValue()`, `getFacetedUniqueValues()` и т.п.), доступное
через `children`-рендер-проп корня. Так и планировалось для `column-filter` (была мысль про
«несколько частей анатомии под текст/select/диапазон») — на практике не подтвердилось, план в
`ROADMAP.yaml` был скорректирован постфактум.

### Сборки — витрины, не переключатель фич

`playground/assemblies/` показывают возможности паспорта для редактора/документации. Включение
конкретной фичи для реального потребителя — ВСЕГДА проп на `<TableRoot>` напрямую, никогда не
«эта фича доступна только в сборке X». Не придумывать новые сборки самовольно — если чинишь тест,
что ссылается на несуществующую сборку, это повод спросить, а не молча дописать новую.

## Известные, названные пределы (не баг, не забыто)

### Закрепление колонок — sticky верно только для ОДНОЙ колонки на сторону

TanStack v9 убрал автоматический расчёт px-смещения для нескольких закреплённых колонок с одной
стороны (был в v8, завязан на ресайз колонок). Recipe ставит `insetInlineStart/End: 0` — честно для
ровно одной закреплённой колонки на сторону; вторая легла бы поверх первой. Настоящий расчёт —
предмет будущего `column-resizing` (веха `column-structure`), не костыляется здесь заранее.

## Процесс

- Перед финальной проверкой фичи — `rm -rf node_modules/.vite && npx vitest run`: устаревший
  Vite dependency-кэш маскирует реальное состояние, особенно после добавления новых импортов из
  `@tanstack/solid-table`.
- Источник правды по API TanStack v9 — исходники в
  `node_modules/.pnpm/@tanstack+table-core@*/node_modules/@tanstack/table-core/dist/`, не docs
  сайта и не память по v8: пакет свежий, поведение подмечено расходящимся с первым впечатлением от
  `.d.ts`-комментариев не один раз (`filterFn: "auto"`, тихий фолбэк faceted-значений).
