# 🧪 Примеры — как работать с `Table`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md), план —
[`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и сразу погонять.

## 1. Ручная сборка — голая сетка

Самый простой путь: `columns`+`data`, без единой строчки собственной вёрстки — стандартная структура
корня строит `head`+`body` сама.

```tsx
import { TableRoot, type TableColumn } from "@web-core/ui";

type Person = { name: string; role: string; age: number };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
  { accessorKey: "age", header: "Возраст" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер", age: 29 },
  { name: "Борис", role: "Инженер", age: 34 },
  { name: "Вера", role: "Менеджер", age: 41 },
];

export function BasicTableDemo() {
  return <TableRoot columns={columns} data={people} />;
}
```

Полезно проверить: три строки, три заголовка, ни одна колонка не сортируется (не задан
`defaultSorting`), кликом по заголовку ничего не происходит.

## 2. Сортировка кликом — одна колонка

`defaultSorting` — неуправляемый старт, дальше `TableRoot` сам держит состояние. Порядок массива —
приоритет: первый элемент решает первым (важно при мультисортировке, см. пример 3).

```tsx
import { TableRoot, type TableColumn } from "@web-core/ui";

type Person = { name: string; role: string; age: number };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
  { accessorKey: "age", header: "Возраст" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер", age: 29 },
  { name: "Борис", role: "Инженер", age: 34 },
  { name: "Вера", role: "Менеджер", age: 41 },
];

export function SortableTableDemo() {
  return (
    <TableRoot columns={columns} data={people} defaultSorting={[{ columnId: "name", desc: false }]} />
  );
}
```

Полезно проверить: старт — по имени, по возрастанию (`[data-state="ascending"]` на заголовке «Имя»,
`aria-sort="ascending"`). Клик по «Имя» — убывание. Клик по «Роль»/«Возраст» — сортировка
переключается на эту колонку целиком (одна активная), не добавляется к «Имя».

## 3. Мультисортировка — shift+клик добавляет, не заменяет

`enableMultiSort: true` включён в ките всегда (`components/root.tsx`) — трогать нечего, просто
shift+клик по второй кнопке сортировки. Приоритет виден и в `data-state`/`aria-sort`, и в самом
тексте заголовка (`Имя (1)`), и в CSS-переменной `--sort-index` на кнопке.

```tsx
import { TableRoot, type TableColumn } from "@web-core/ui";

type Person = { name: string; role: string; age: number };

const columns: TableColumn<Person>[] = [
  { accessorKey: "role", header: "Роль" },
  { accessorKey: "name", header: "Имя" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер" },
  { name: "Борис", role: "Инженер" },
  { name: "Вера", role: "Дизайнер" },
];

export function MultiSortTableDemo() {
  return (
    <TableRoot
      columns={columns}
      data={people}
      defaultSorting={[
        { columnId: "role", desc: false },
        { columnId: "name", desc: false },
      ]}
    />
  );
}
```

Полезно проверить: обе кнопки сортировки стартуют `ascending`, «Роль» несёт `--sort-index: 1`, «Имя»
— `--sort-index: 2`. Строки идут сгруппированные по роли, а внутри роли — по имени. Клик (без shift)
по одной кнопке сбрасывает мультисортировку до одной этой колонки.

## 4. Выбор строк — чекбоксы, `indeterminate`, массовые действия

`enableRowSelection` выключен по умолчанию — чекбокс-колонка появляется, только если он явно задан.
Чекбоксы настоящие (`<input type="checkbox">`), `indeterminate` — реальное DOM-свойство, не атрибут.
`TableHeaderSelectTrigger`/`TableRowSelectTrigger` растут сами в стандартной структуре — руками их
заводить не нужно.

```tsx
import { createSignal } from "solid-js";
import { TableRoot, type TableColumn, type TableRowSelection } from "@web-core/ui";

type Person = { id: string; name: string; role: string };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
];

const people: Person[] = [
  { id: "1", name: "Аня", role: "Дизайнер" },
  { id: "2", name: "Борис", role: "Инженер" },
  { id: "3", name: "Вера", role: "Менеджер" },
];

export function SelectableTableDemo() {
  const [rowSelection, setRowSelection] = createSignal<TableRowSelection>({});
  const selectedCount = () => Object.values(rowSelection()).filter(Boolean).length;

  return (
    <div>
      <p>Выбрано: {selectedCount()}</p>
      <button disabled={selectedCount() === 0}>Удалить выбранные</button>

      <TableRoot
        columns={columns}
        data={people}
        getRowId={(row) => row.id}
        enableRowSelection
        rowSelection={rowSelection()}
        onRowSelectionChange={setRowSelection}
      />
    </div>
  );
}
```

Полезно проверить: клик по одной строке — `[data-selected]` только на ней, чекбокс «выбрать всё» в
`indeterminate`. Клик по чекбоксу «выбрать всё» — отмечает/снимает все разом. Тулбар с количеством —
не часть таблицы, обычная сборка вокруг неё (см. ROADMAP, `bulk-actions`).

## 5. Видимость колонок — своей анатомии нет, переключатель ваш

Скрытая колонка не рисует ни `headerCell`, ни `cell` вовсе (не `display:none` — узла просто нет).
`table.getAllColumns()`/`column.getToggleVisibilityHandler()` дают всё для своего переключателя.

```tsx
import { createSignal } from "solid-js";
import { TableRoot, type TableColumn, type TableColumnVisibility } from "@web-core/ui";

type Person = { name: string; role: string; age: number };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
  { accessorKey: "age", header: "Возраст" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер", age: 29 },
  { name: "Борис", role: "Инженер", age: 34 },
];

export function ColumnVisibilityDemo() {
  const [visibility, setVisibility] = createSignal<TableColumnVisibility>({});

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={visibility().age !== false}
          onChange={(event) => setVisibility((prev) => ({ ...prev, age: event.currentTarget.checked }))}
        />
        Показывать «Возраст»
      </label>

      <TableRoot columns={columns} data={people} columnVisibility={visibility()} />
    </div>
  );
}
```

Полезно проверить: снял галочку — колонка «Возраст» пропадает и из шапки, и из каждой строки, ширина
таблицы пересчитывается сама (обычный `<table>`, не абсолютное позиционирование).

## 6. Закрепление колонок — `start`/`end`, не `left`/`right`

Терминология TanStack v9 логическая (направление письма), не физическая. Закреплённая колонка
физически переезжает к своему краю — `start` → `center` → `end`, три группы по порядку.

```tsx
import { TableRoot, type TableColumn } from "@web-core/ui";

type Person = { id: string; name: string; role: string; age: number };

const columns: TableColumn<Person>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
  { accessorKey: "age", header: "Возраст" },
];

const people: Person[] = [
  { id: "1", name: "Аня", role: "Дизайнер", age: 29 },
  { id: "2", name: "Борис", role: "Инженер", age: 34 },
];

export function ColumnPinningDemo() {
  return (
    <TableRoot columns={columns} data={people} defaultColumnPinning={{ start: ["id"], end: [] }} />
  );
}
```

Полезно проверить: «ID» всегда первая колонка, несёт `[data-pinned="start"]` и на `headerCell`, и на
каждой `cell` в этой колонке. Честный предел (см. README) — работает ровно для ОДНОЙ закреплённой
колонки на сторону; вторая с той же стороны легла бы поверх первой (ждёт `column-resizing`).

## 7. Глобальный поиск — управляемый, ищет по всем колонкам разом

Своей анатомии под поле ввода кит не заводит — то же решение, что у видимости колонок. Поиск
регистронезависимый, подстрокой, по всем колонкам сразу.

```tsx
import { createSignal } from "solid-js";
import { TableRoot, type TableColumn } from "@web-core/ui";

type Person = { name: string; role: string };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер" },
  { name: "Борис", role: "Инженер" },
  { name: "Вера", role: "Менеджер" },
];

export function GlobalSearchDemo() {
  const [search, setSearch] = createSignal("");

  return (
    <div>
      <input
        placeholder="Искать по всей таблице…"
        value={search()}
        onInput={(event) => setSearch(event.currentTarget.value)}
      />
      <TableRoot columns={columns} data={people} globalFilter={search()} onGlobalFilterChange={setSearch} />
    </div>
  );
}
```

Полезно проверить: ввод «инжен» оставляет только Бориса, регистр не важен («ИНЖЕН» — тот же
результат), очистка поля возвращает все строки.

## 8. Фильтр по одной колонке

Тот же управляемый паттерн — `columnFilters`/`onColumnFiltersChange`, по одному `{ id, value }` на
отфильтрованную колонку. Виджет (текст/select/диапазон) — обычное содержимое, кит его не рисует.

```tsx
import { createSignal } from "solid-js";
import { TableRoot, type TableColumn, type TableColumnFilters } from "@web-core/ui";

type Person = { name: string; role: string };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер" },
  { name: "Борис", role: "Инженер" },
  { name: "Дизайнерова", role: "Менеджер" },
];

export function ColumnFilterDemo() {
  const [roleFilter, setRoleFilter] = createSignal("");
  const columnFilters = (): TableColumnFilters => (roleFilter() ? [{ id: "role", value: roleFilter() }] : []);

  return (
    <div>
      <input
        placeholder="Фильтр по роли…"
        value={roleFilter()}
        onInput={(event) => setRoleFilter(event.currentTarget.value)}
      />
      <TableRoot
        columns={columns}
        data={people}
        columnFilters={columnFilters()}
        onColumnFiltersChange={(next) => setRoleFilter(String(next.find((f) => f.id === "role")?.value ?? ""))}
      />
    </div>
  );
}
```

Полезно проверить: фильтр «диз» по роли оставляет только Аню (её роль — «Дизайнер»), «Дизайнерова» в
имени другой строки не совпадает — фильтр честно смотрит только в колонку `role`, не во все поля
сразу (это работа глобального поиска, пример 7, не этого).

## 9. Faceted-значения — счётчики для выпадающего фильтра

`table.getColumn(id).getFacetedUniqueValues()` — готовый `Map<значение, count>`, считает по всем
строкам с учётом фильтров ОСТАЛЬНЫХ колонок, но не своей. Своей анатомии не заводит — доступ к
`table`-инстансу только через `children`.

```tsx
import { For } from "solid-js";
import { TableRoot, TableHead, TableHeadRow, TableHeaderCell, TableBody, TableRow, TableCell, type TableColumn } from "@web-core/ui";

type Person = { name: string; role: string };

const columns: TableColumn<Person>[] = [
  { accessorKey: "name", header: "Имя" },
  { accessorKey: "role", header: "Роль" },
];

const people: Person[] = [
  { name: "Аня", role: "Дизайнер" },
  { name: "Борис", role: "Инженер" },
  { name: "Вера", role: "Дизайнер" },
];

export function FacetedValuesDemo() {
  return (
    <TableRoot columns={columns} data={people}>
      {(table) => (
        <>
          <select>
            <For each={[...table.getColumn("role")!.getFacetedUniqueValues()]}>
              {([value, count]) => (
                <option value={String(value)}>
                  {String(value)} ({count})
                </option>
              )}
            </For>
          </select>

          <TableHead>
            <For each={table.getHeaderGroups()}>
              {(group) => (
                <TableHeadRow>
                  <For each={group.headers}>
                    {(header) => <TableHeaderCell header={header}>{String(header.column.columnDef.header)}</TableHeaderCell>}
                  </For>
                </TableHeadRow>
              )}
            </For>
          </TableHead>
          <TableBody>
            <For each={table.getRowModel().rows}>
              {(row) => (
                <TableRow>
                  <For each={row.getAllCells()}>{(cell) => <TableCell>{String(cell.getValue())}</TableCell>}</For>
                </TableRow>
              )}
            </For>
          </TableBody>
        </>
      )}
    </TableRoot>
  );
}
```

Полезно проверить: список показывает «Дизайнер (2)», «Инженер (1)» — не по одному пункту на строку,
а сгруппированные уникальные значения с реальным счётчиком.

## 10. Рендер через движок — сборка `basic`

Та же голая сетка, что в примере 1, но собранная по схеме и нарисованная `RenderTree`. `data`,
`columns` и `defaultSorting` приходят через `bind` целиком — сборка не несёт ни строчки чужого
контента, любая форма данных проходит через ту же сборку.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { instanceOf } from "@web-core/skin/editor";

const data = {
  data: [
    { name: "Аня", role: "Дизайнер", age: 29 },
    { name: "Борис", role: "Инженер", age: 34 },
  ],
  columns: [
    { accessorKey: "name", header: "Имя" },
    { accessorKey: "role", header: "Роль" },
    { accessorKey: "age", header: "Возраст" },
  ],
  defaultSorting: [{ columnId: "name", desc: false }],
};

const tree = instanceOf("table", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

`registry` — не заглушка, а настоящий `Registry` со всеми компонентами, которые могут встретиться в
дереве; берите готовый из `apps/skin`, собирать вручную под один компонент смысла нет.

## 11. Живой поиск через движок — сборка `with-search` + `EventBinding`

Сборка `with-search` — тот же `basic`, плюс `globalFilter` под внешним контролем (см. `entity/io.ts`).
Само поле ввода — ОТДЕЛЬНАЯ маленькая сборка, не часть анатомии `table` (`<table>` не принимает
`<input>` ребёнком) — узел с `on: { input: { event: { context: { term: { event: "target.value" } } } } }`
дошёл до реальной клавиатуры через `EventBinding` (движок `packages/assembly`, читает живое
DOM-событие, не только уже забинженные данные — до этого фикса такое было невыразимо в принципе).
Обе сборки рендерятся своим `RenderTree`, склеены одним `dispatch`, который в реальном приложении
держит стор, а не сигнал — полный рабочий вариант с настоящим `Registry` см.
`test/with-search.test.tsx`.

```tsx
import { createSignal } from "solid-js";
import { RenderTree } from "@web-core/assembly/render";
import { instanceOf } from "@web-core/skin/editor";
import type { DispatchedEvent } from "@web-core/assembly";

const SEARCH_TREE = {
  components: {
    root: "root",
    nodes: {
      root: {
        id: "root",
        type: "search-input", // ваш компонент с полем ввода, зарегистрированный в registry
        parentId: null,
        children: [],
        on: {
          input: {
            event: { name: "search", context: { term: { event: "target.value" } } },
          },
        },
      },
    },
  },
};

export function TableWithSearchDemo() {
  const [data, setData] = createSignal({
    data: [
      { name: "Аня", role: "Дизайнер", age: 29 },
      { name: "Борис", role: "Инженер", age: 34 },
    ],
    columns: [
      { accessorKey: "name", header: "Имя" },
      { accessorKey: "role", header: "Роль" },
      { accessorKey: "age", header: "Возраст" },
    ],
    defaultSorting: [{ columnId: "name", desc: false }],
    globalFilter: "",
  });

  const dispatch = (event: DispatchedEvent) => {
    if (event.name === "search") setData((prev) => ({ ...prev, globalFilter: String(event.context.term ?? "") }));
  };

  const tree = instanceOf("table", {}, "with-search", data());

  return (
    <>
      <RenderTree tree={SEARCH_TREE} registry={registry} dispatch={dispatch} />
      <RenderTree tree={tree} registry={registry} data={data()} />
    </>
  );
}
```

Полезно проверить: набранный текст реально уходит через `dispatch` (не мок), таблица сужается
ровно так же, как в примере 7 — разница только в том, что здесь весь путь декларативный (JSON-дерево
+ `dispatch`), а не хендлеры в JSX. Это первая «ситуационная» сборка кита — набор фич под задачу
(здесь: живой поиск), не под форму конкретной сущности бэкенда (см. `columns-as-bound-data` в
ROADMAP — «своя сборка под каждый набор данных» уже отклонялась явно как несмасштабируемая).

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница:

```tsx
import { SelectableTableDemo } from "..."; // любой пример выше

export function LabPage() {
  return <SelectableTableDemo />;
}
```
