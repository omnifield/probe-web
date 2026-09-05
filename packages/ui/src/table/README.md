# 🗂️ Table

<h2 id="главное">🏠 Главное</h2>

🏷️ other · 🧬 component · 📐 wide · 📦 `@web-core/ui`

Таблица данных 🗂️: строки и колонки, сортировка по одной или нескольким колонкам, выбор строк,
скрытие и закрепление колонок, поиск по всей таблице или по отдельной колонке.

<h2 id="анатомия">🧩 Анатомия</h2>

Таблица собрана из настоящих `<table>`/`<tr>`/`<th>`/`<td>` — не имитация вёрсткой поверх `<div>`.
Заголовок колонки и кнопка сортировки в нём — разные части: заголовок остаётся заголовком, даже
если колонка вообще не умеет сортироваться, а кнопка появляется только там, где она реально нужна.

```
root
├─ caption
├─ head
│  └─ headRow
│     └─ headerCell[]
│        ├─ headerSortTrigger
│        └─ headerSelectTrigger
└─ body
   └─ row[]
      └─ cell[]
         └─ rowSelectTrigger
```

| часть                    | значение                                                                           | принимает внутри                                  | рисуется                   |
| ------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------- |
| 🗂️ `root`                | таблица целиком                                                                    | `caption`, `head`, `body`                         | `TableRoot`                |
| `caption`                | собственная подпись таблицы — что она показывает                                   | текст                                             | `TableCaption`             |
| `head`                   | оборачивает строку(и) заголовков                                                   | `headRow`                                         | `TableHead`                |
| `headRow`                | одна строка заголовков колонок                                                     | `headerCell`                                      | `TableHeadRow`             |
| `headerCell`             | заголовок одной колонки — несёт вид сортировки для неё, есть кнопка внутри или нет | `headerSortTrigger`, `headerSelectTrigger`, текст | `TableHeaderCell`          |
| `headerSortTrigger`      | кнопка, переключающая сортировку этой колонки                                      | текст, иконка                                     | `TableHeaderSortTrigger`   |
| ☑️ `headerSelectTrigger` | чекбокс «выбрать все строки» — отмечен целиком, частично или пусто                 | —                                                 | `TableHeaderSelectTrigger` |
| `body`                   | оборачивает строки данных                                                          | `row`                                             | `TableBody`                |
| `row`                    | одна строка данных — несёт выбор, если включён                                     | `cell`                                            | `TableRow`                 |
| `cell`                   | одна ячейка — содержимое даёт потребитель                                          | текст, иконка, любой компонент                    | `TableCell`                |
| ☑️ `rowSelectTrigger`    | чекбокс выбора одной строки                                                        | —                                                 | `TableRowSelectTrigger`    |

> [!NOTE]
> `headerCell` и `headerSortTrigger` — НАМЕРЕННО две разные части, не одна. Тот же разрез, что
> аккордеон проводит между `item` (носитель состояния) и `trigger` (то, по чему кликают).
> `aria-sort` принадлежит самому `<th>` по роли WAI-ARIA `columnheader`, а не кнопке внутри него;
> клик и его hover/active/focus-visible вид принадлежат настоящей `<button>`, которой `<th>` не
> является и не должна притворяться. Раздельные части позволяют скину адресовать «вид
> отсортированного заголовка» и «вид нажатой кнопки сортировки» независимо, и позволяют колонке,
> которая не сортируется, просто не нести `headerSortTrigger` — сама ячейка при этом никогда не
> выглядит ложно интерактивной.

> [!NOTE]
> `headerSortTrigger` несёт `--sort-index` (`kit`) — приоритет этой колонки в мультисортировке,
> считая с 1; не выставлена вовсе, пока колонка не отсортирована. Мультисортировка включена
> (`enableMultiSort: true`) — shift+клик по второй кнопке сортировки добавляет её к активной, не
> заменяет. Стандартная структура корня (сборка `basic` и любой рендер без своего `children`)
> добавляет тот же номер прямо в видимый текст заголовка (`Имя (1)`); рукописный `children`
> волен читать `header.column.getSortIndex()` и решать сам, показывать ли его вообще.

> [!NOTE]
> `cell` до сих пор не несёт ресайза/группировки колонок — те остаются предметом продуктового
> `DataTable` из `products/tables`, та же сдержанность «не строить вперёд спроса», которую
> собственная анатомия `grid`'а называет для своей `cell`. `row` с 03.09.2026 несёт `selected`
> (см. ниже), `headerCell`/`cell` — `pinned-start`/`pinned-end` — выбор и закрепление вошли в объём
> v1 первыми из отложенных пунктов.

> [!NOTE]
> Закрепление — `start`/`end`, не `left`/`right`: терминология TanStack v9 целиком (и состояние
> `columnPinning`, и `column.getIsPinned()`) логическая, не физическая — совпадает с направлением
> письма, а не с «левым»/«правым» экраном. Кит следует ей буквально, а не переводит на CSS-жаргон,
> чтобы не разойтись при чтении API TanStack напрямую. В recipe это ложится на логические
> CSS-свойства (`insetInlineStart`/`insetInlineEnd`), не на `left`/`right` в буквальном смысле.

> [!NOTE]
> Смещение приклеенной колонки при НЕСКОЛЬКИХ закреплённых с одной стороны — известный, названный
> предел, не тихо забытый случай. TanStack v9 убрал автоматический расчёт px-смещения (был в v8,
> завязан на ресайз колонок) — `position: sticky` в рецепте ставит `insetInlineStart/End: 0`,
> честно для РОВНО одной закреплённой колонки на сторону. Вторая закреплённая колонка на той же
> стороне легла бы поверх первой, а не рядом. Настоящее вычисление смещения — предмет `column-
resizing` (следующий заход `column-structure`), не изобретается здесь заранее.

> [!NOTE]
> `headerSelectTrigger`/`rowSelectTrigger` — настоящие `<input type="checkbox">`, не разметка
> `checkbox`-компонента кита: чекбокс-колонка не несёт своего плавающего слоя/машины состояний,
> ей нужен только нативный чекбокс с `indeterminate` (свойство DOM, не HTML-атрибут — выставляется
> вручную через `ref`+`createEffect`, реактивно). Выбор ВЫКЛЮЧЕН по умолчанию
> (`enableRowSelection?: boolean`, обычный проп `TableRoot`, не `settings` паспорта) — чекбокс-
> колонка стандартной структуры появляется, только если он явно задан.

<h2 id="использование">🚀 Использование</h2>

Каждая фича включается своим пропом на `TableRoot` и работает независимо от остальных — сортировку,
выбор строк, видимость и закрепление колонок, поиск можно включать по одной или сразу все вместе. 🧮

**Ручная сборка** — рукописный рендер-проп, полный контроль над содержимым ячеек. `defaultSorting`
— массив: порядок элементов и есть приоритет сортировки, первый решает первым.

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultSorting={[{ columnId: "name", desc: false }]}
>
  {(table) => (
    <>
      <TableHead>
        <For each={table.getHeaderGroups()}>
          {(group) => (
            <TableHeadRow>
              <For each={group.headers}>
                {(header) => (
                  <TableHeaderCell header={header}>
                    <TableHeaderSortTrigger header={header}>
                      {String(header.column.columnDef.header)}
                    </TableHeaderSortTrigger>
                  </TableHeaderCell>
                )}
              </For>
            </TableHeadRow>
          )}
        </For>
      </TableHead>
      <TableBody>
        <For each={table.getRowModel().rows}>
          {(row) => (
            <TableRow>
              <For each={row.getAllCells()}>
                {(cell) => <TableCell>{String(cell.getValue())}</TableCell>}
              </For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </>
  )}
</TableRoot>
```

Или — стандартная структура (тот же результат, что и рукописный пример выше, минус собственное
содержимое ячейки):

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultSorting={[{ columnId: "name", desc: false }]}
/>
```

**Мультисортировка.** Shift+клик по кнопке сортировки другой колонки добавляет её к активной, не
заменяет — `defaultSorting`/`sorting` с несколькими элементами сразу заводит несколько активных
колонок в том же порядке.

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultSorting={[
    { columnId: "role", desc: false },
    { columnId: "name", desc: false },
  ]}
/>
```

**Рендер через движок** — та же композиция (стандартная структура), но по схеме (сборка `basic`),
которую рисует `RenderTree`.

```tsx
const tree = instanceOf("table", {}, "basic", {});

<RenderTree tree={tree} registry={registry} data={{}} />;
```

**Управляемая сортировка.** `sorting`/`onSortingChange` берут сортировку под внешний контроль —
`defaultSorting` тогда игнорируется.

```tsx
const [sorting, setSorting] = createSignal<readonly TableSort[]>([]);

<TableRoot
  columns={columns}
  data={people}
  sorting={sorting()}
  onSortingChange={setSorting}
/>;
```

> [!NOTE]
> `TanStack` v9 — стор-бэкед, не обёрнут в Solid `Accessor`: чтение `table.getRowModel()` внутри
> JSX уже участвует в точечной реактивности Solid без лишних `()` — собственный doc-комментарий
> `createTable` называет это прямо.

**Выбор строк.** `enableRowSelection` — обычный проп, выключен по умолчанию; стандартная структура
корня сама добавляет чекбокс-колонку первой, когда он включён — ни `columns`, ни ручную композицию
трогать не нужно.

```tsx
<TableRoot columns={columns} data={people} enableRowSelection />
```

Управляемый выбор — `rowSelection`/`onRowSelectionChange`, форма та же, что несёт сам TanStack
(`Record<string, true>`, ключ — id строки):

```tsx
const [rowSelection, setRowSelection] = createSignal<TableRowSelection>({});

<TableRoot
  columns={columns}
  data={people}
  enableRowSelection
  rowSelection={rowSelection()}
  onRowSelectionChange={setRowSelection}
/>;
```

Рукописный `children` читает `table.getIsAllRowsSelected()`/`row.getIsSelected()` и рисует чекбоксы
сам — `TableHeaderSelectTrigger`/`TableRowSelectTrigger` доступны отдельно тем же образом, что
`TableHeaderSortTrigger`.

**Видимость колонок.** Никакой новой анатомии не заводит — скрытая колонка просто не рисует свою
`headerCell`/`cell` вовсе (стандартная структура читает `row.getVisibleCells()`, не
`row.getAllCells()`). Управление тем же паттерном, что сортировка/выбор — `columnVisibility`/
`defaultColumnVisibility`/`onColumnVisibilityChange`, ключ объекта — id колонки, `false` прячет её.

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultColumnVisibility={{ role: false }}
/>
```

Переключатель («показать/скрыть колонку X») кит не рисует сам — та же граница, что у чекбокс-
колонки выбора: `table.getAllColumns()`/`column.getToggleVisibilityHandler()`/`column.getIsVisible()`
дают всё нужное, собрать сам список — дело потребителя (обычно меню, `table`'а как компонента это
не касается).

**Закрепление колонок.** Закреплённая колонка физически переезжает к своему краю — стандартная
структура рисует три группы по порядку: `start` (закреплённые к началу) → `center` (обычные) →
`end` (закреплённые к концу), тем же способом, которым TanStack сам делит колонки.

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultColumnPinning={{ start: ["id"], end: [] }}
/>
```

Рукописный `children` — та же трёхгруппая раскладка, `table.getStartLeafHeaders()`/
`getCenterLeafHeaders()`/`getEndLeafHeaders()` для шапки, `row.getStartVisibleCells()`/
`getCenterVisibleCells()`/`getEndVisibleCells()` для каждой строки:

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultColumnPinning={{ start: ["id"], end: [] }}
>
  {(table) => (
    <>
      <TableHead>
        <TableHeadRow>
          <For each={table.getStartLeafHeaders()}>
            {(header) => (
              <TableHeaderCell header={header}>
                {String(header.column.columnDef.header)}
              </TableHeaderCell>
            )}
          </For>
          <For each={table.getCenterLeafHeaders()}>
            {(header) => (
              <TableHeaderCell header={header}>
                {String(header.column.columnDef.header)}
              </TableHeaderCell>
            )}
          </For>
        </TableHeadRow>
      </TableHead>
      <TableBody>
        <For each={table.getRowModel().rows}>
          {(row) => (
            <TableRow row={row}>
              <For each={row.getStartVisibleCells()}>
                {(cell) => (
                  <TableCell cell={cell}>{String(cell.getValue())}</TableCell>
                )}
              </For>
              <For each={row.getCenterVisibleCells()}>
                {(cell) => (
                  <TableCell cell={cell}>{String(cell.getValue())}</TableCell>
                )}
              </For>
            </TableRow>
          )}
        </For>
      </TableBody>
    </>
  )}
</TableRoot>
```

**Глобальный поиск.** Ищет по всем колонкам разом, регистронезависимо, подстрокой
(`includesString` — единственная встроенная функция фильтра, что кит регистрирует; TanStack v9 не
регистрирует ни одной сама, чтобы неиспользуемые не тянулись в бандл). Своей анатомии под поле
ввода кит не заводит — то же решение, что у видимости колонок: `globalFilter`/
`defaultGlobalFilter`/`onGlobalFilterChange` управляют состоянием, само поле рисует потребитель.

```tsx
<TableRoot columns={columns} data={people} defaultGlobalFilter="инженер" />
```

Управляемый поиск — тот же паттерн, что сортировка/выбор/видимость:

```tsx
const [search, setSearch] = createSignal("");

<>
  <input
    value={search()}
    onInput={(event) => setSearch(event.currentTarget.value)}
  />
  <TableRoot
    columns={columns}
    data={people}
    globalFilter={search()}
    onGlobalFilterChange={setSearch}
  />
</>;
```

**Фильтр по колонке.** По одному `{ id, value }` на отфильтрованную колонку — `columnFilters`/
`defaultColumnFilters`/`onColumnFiltersChange`, тот же управляемый/неуправляемый паттерн. Виджет
фильтра (текстовое поле, select, диапазон, дата) — дело потребителя и живёт внутри `headerCell` как
обычное содержимое; своей части кит под него не заводит — то же решение, что у глобального поиска.
Функция сравнения выбирается автоматически по типу значения (`filterFn: "auto"`): для строки это
та же `includesString`, что уже зарегистрирована под глобальный поиск, регистрировать её отдельно
не нужно.

```tsx
<TableRoot
  columns={columns}
  data={people}
  defaultColumnFilters={[{ id: "role", value: "инженер" }]}
/>
```

Управляемый вариант — поле рисует потребитель и обновляет через `column.setFilterValue()` или
внешний сигнал, как у остальных фич:

```tsx
const [roleFilter, setRoleFilter] = createSignal("");

<>
  <input
    value={roleFilter()}
    onInput={(event) => setRoleFilter(event.currentTarget.value)}
  />
  <TableRoot
    columns={columns}
    data={people}
    columnFilters={roleFilter() ? [{ id: "role", value: roleFilter() }] : []}
    onColumnFiltersChange={(next) =>
      setRoleFilter(String(next.find((f) => f.id === "role")?.value ?? ""))
    }
  />
</>;
```

**Faceted-значения.** `table.getColumn(id).getFacetedUniqueValues()` — `Map<значение, count>` по
одной колонке, для построения списка опций выпадающего фильтра. Считает по всем строкам с учётом
фильтров всех _остальных_ колонок и глобального поиска, но не своего собственного — так список
опций не схлопывается до одного пункта, когда фильтр уже применён. Своей анатомии не заводит — как
и фильтр по колонке, это чистый доступ к состоянию `table`-инстанса через `children`:

```tsx
<TableRoot columns={columns} data={people}>
  {(table) => (
    <>
      <For each={[...table.getColumn("role")!.getFacetedUniqueValues()]}>
        {([value, count]) => (
          <option value={String(value)}>
            {String(value)} ({count})
          </option>
        )}
      </For>
      {/* остальная разметка таблицы, как в примере с закреплением колонок выше */}
    </>
  )}
</TableRoot>
```

<h2 id="состояния">🎛️ Состояния</h2>

Состояния таблицы почти все — про заголовок: отсортирована колонка или нет и в какую сторону,
закреплена ли она у края. У строк и ячеек забота одна — выбрана строка или нет, закреплена ли её
ячейка у того же края, что и заголовок над ней.

|      | часть                                 | состояние                      | метка                                   | значение                                                            |
| ---- | ------------------------------------- | ------------------------------ | --------------------------------------- | ------------------------------------------------------------------- |
| ⬆️   | headerCell, headerSortTrigger         | ascending                      | `[data-state="ascending"]`              | эта колонка сейчас отсортирована по возрастанию                     |
| ⬇️   | headerCell, headerSortTrigger         | descending                     | `[data-state="descending"]`             | эта колонка сейчас отсортирована по убыванию                        |
| ➖   | headerCell, headerSortTrigger         | none                           | `[data-state="none"]`                   | колонка умеет сортироваться, но сейчас не она отсортирована         |
| 🚫   | headerSortTrigger                     | disabled                       | `:disabled`                             | колонка не умеет сортироваться — нативный вид, без поведения кнопки |
| 👆🎯 | headerSortTrigger                     | hover / focus-visible / active | `:hover` / `:focus-visible` / `:active` | обычное поведение кнопки, JS-перехвата указателя нет                |
| ☑️   | headerSelectTrigger, rowSelectTrigger | checked                        | `:checked`                              | отмечен                                                             |
| ➖   | headerSelectTrigger                   | indeterminate                  | `:indeterminate`                        | выбраны не все строки, но и не ноль                                 |
| 🚫   | headerSelectTrigger, rowSelectTrigger | disabled                       | `:disabled`                             | этот чекбокс нельзя использовать                                    |
| 👆🎯 | headerSelectTrigger, rowSelectTrigger | hover / focus-visible / active | `:hover` / `:focus-visible` / `:active` | нативные псевдоклассы чекбокса                                      |
| ✅   | row                                   | selected                       | `[data-selected]`                       | эта строка выбрана                                                  |
| ⏪   | headerCell, cell                      | pinned-start                   | `[data-pinned="start"]`                 | колонка закреплена у начала — не уезжает при горизонтальном скролле |
| ⏩   | headerCell, cell                      | pinned-end                     | `[data-pinned="end"]`                   | колонка закреплена у конца — не уезжает при горизонтальном скролле  |

`root`/`caption`/`head`/`headRow`/`body` — пять из десяти частей, состояний не несут вовсе: чистая
структура (проверяемое заявление, не заглушка «пока не собрались»).

> [!NOTE]
> `ascending`/`descending`/`none` на `data-state` — общий трёхзначный атрибут на ДВУХ частях, тот
> же приём, что уже несёт `checked`/`unchecked`/`indeterminate` чекбокса для одного общего
> атрибута с более чем двумя значениями. Метка на `headerCell` ОПУЩЕНА ЦЕЛИКОМ (не выставлена в
> `"none"`), когда колонка не умеет сортироваться, — зеркалит `aria-sort`, который роль WAI-ARIA
> `columnheader` разрешает только колонкам, которые реально это умеют. Заявлять `data-state="none"`
> на каждой колонке, сортируемой или нет, означало бы утверждать возможность, которой нет.

> [!NOTE]
> `hover`/`active`/`focus-visible` у `headerSortTrigger` — настоящие псевдоклассы, JS-трекинга
> указателя в компоненте нет вовсе, тот же довод, что у обычной кнопки и у пункта `toggle-group`.
> `disabled` — нативный атрибут элемента (`header.column.getCanSort()` лживо), так что `:disabled`
> — честная метка, браузер даёт её бесплатно, та же категория, что `:hover`/`:active` здесь.

<h2 id="сборки">🏗️ Сборки</h2>

Одна сборка — рабочая таблица целиком, с настоящей сортировкой кликом, без единой строчки
собственной вёрстки. Показать составные части таблицы по отдельности отдельными примерами незачем
— собранная и разобранная вручную таблица рисуют одну и ту же живую `table`.

<h3 id="сборка-basic">🧱 basic</h3>

```
root · props: columns, data, defaultSorting
```

Одна голая ссылка на `root`, без детей: собственная СТАНДАРТНАЯ структура корня (без переданного
`children`-рендер-пропа) строит `head`+`body` сама из `columns`/`data` — та же живая `table`,
которую получил бы рукописный рендер-проп, сортировка кликом работает по-настоящему. Остальные
восемь частей остаются настоящими, адресуемыми (скин стилизует `headerCell`/`cell`/… как любую
другую часть), просто им не нужно быть буквальными узлами именно в ЭТОЙ сборке: корень растит их
сам во время рендера.

> [!NOTE]
> `children` У КОРНЯ — НЕОБЯЗАТЕЛЬНЫЙ, и это не сокращение пути, а второй настоящий вызывающий.
> Превьюер дерева сборки (`packages/assembly/src/render.tsx`) передаёт `children` каждого узла уже
> ГОТОВЫМ поддеревом, единообразно, для любого компонента кита — функцию-рендер-проп этим путём
> передать нельзя. Сборка, которая хочет показать таблицу по-настоящему, тем же способом, которым
> она показывает живой `Accordion`/`Tabs`, не может дать функцию. Поэтому пропуск `children` рисует
> СТАНДАРТНУЮ структуру, построенную из той же живой `table`, что получил бы рукописный рендер-проп
> — сортировка в ней по-настоящему живая, не статичный мокап. Рукописному потребителю, которому
> нужно собственное содержимое ячейки, `children` всё равно доступен и даёт полный контроль.

<h2 id="рецепт">🎨 Рецепт</h2>

Своих именованных видов у таблицы нет — только состояния. Выбранная строка подсвечена едва
заметной заливкой, не рамкой и не жирным. Закреплённая колонка держится на месте (`position:
sticky`) и получает собственный непрозрачный фон — иначе сквозь неё было бы видно уезжающие при
скролле соседние колонки. Чекбоксы выбора — что в заголовке, что в строке — настоящие `<input
type="checkbox">`, одного вида на оба места, крашены через `accentColor`, не своей картинкой. 🎨

<h2 id="доступность">♿ Доступность</h2>

`headerCell` несёт `aria-sort` по роли WAI-ARIA `columnheader` для тех колонок, что умеют
сортироваться — экранная читалка объявляет текущее направление сортировки колонки без
дополнительной разметки. 🔊

`headerSelectTrigger`/`rowSelectTrigger` — настоящие `<input type="checkbox">`, доступны с
клавиатуры и экранным читалкам бесплатно, но без видимого текста рядом с ними у чекбокса нет
собственного имени — `aria-label` на каждом (например «Выбрать все строки»/«Выбрать строку»)
остаётся ответственностью потребителя, кит его не придумывает за него.
