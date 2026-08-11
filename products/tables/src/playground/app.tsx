// Площадка зоны — место, где фильтр и таблицу можно потрогать руками. Не витрина (витрина
// это зона `studio`) и не эталон: здесь проверяется UX, поэтому оформление живёт ЗДЕСЬ, в
// потребителе, а не в компонентах — они безголовые и ни одного класса не привозят.

import { createMemo, createSignal, Show } from "solid-js";

import {
  applyFilter,
  type Condition,
  describeFilter,
  EMPTY_FILTER,
  type FieldRef,
  FilterBuilder,
  type FilterState,
  labelsOf,
} from "../filters/index.js";
import {
  type CellContext,
  ColumnControls,
  DataTable,
  EMPTY_SESSION,
  EMPTY_VIEW,
  GroupControls,
  type SessionState,
  TablePager,
  type ViewState,
  visibleColumns,
} from "../table/index.js";
import { COLUMNS, PRESETS, ROWS, TEMPLATES } from "./data.js";

const LABELS = labelsOf(COLUMNS);

/** Поля, которые участвуют в условии, — по ним подсвечиваются ячейки. */
function fieldsOf(condition: Condition): FieldRef[] {
  return condition.kind === "presence" ? condition.fields : [condition.field];
}

/** Тождество строки: на площадке данные локальные, поэтому годится заявитель или агент. */
function rowId(row: Record<string, unknown>, index: number): string {
  return String(row["applicant"] ?? row["agent"] ?? index);
}

export function App() {
  const [filter, setFilter] = createSignal<FilterState>(EMPTY_FILTER);
  const [view, setView] = createSignal<ViewState>({ ...EMPTY_VIEW, pageSize: 10 });
  const [session, setSession] = createSignal<SessionState>(EMPTY_SESSION);
  const [touched, setTouched] = createSignal<CellContext | null>(null);

  // Словарь полей отдаётся вычислителю: без него «сумма больше 90000» сравнивалась бы текстом,
  // а «заведена до 01.07» вообще не имела бы смысла.
  const result = createMemo(() => applyFilter(ROWS, filter(), { fields: COLUMNS }));
  const phrase = createMemo(() => describeFilter(filter(), LABELS));

  const filtered = createMemo(() => new Set(filter().conditions.flatMap(fieldsOf)));

  return (
    <div class="page">
      <header class="page__head">
        <h1>Фильтры и таблица — площадка</h1>
        <p class="page__lead">
          Один словарь полей на отбор и на показ. Данные локальные, набор полей у строк разный,
          контакты лежат вложенно.
        </p>
      </header>

      <section class="page__panel">
        <FilterBuilder
          fields={COLUMNS}
          rows={ROWS}
          state={filter()}
          onChange={setFilter}
          presets={PRESETS}
          templates={TEMPLATES}
        />
      </section>

      <section class="page__summary">
        <p class="page__phrase">{phrase()}</p>
        <p class="page__count">
          Отобрано <strong>{result().rows.length}</strong> из {ROWS.length} · колонок{" "}
          {visibleColumns(COLUMNS, view()).length} из {COLUMNS.length} · выделено{" "}
          {session().selected.length}
        </p>
        <Show when={result().error}>
          {(error) => <p class="page__error">Фильтр не применён: {error()}</p>}
        </Show>
        <Show when={filter().conditions.length > 0}>
          <button type="button" class="page__reset" onClick={() => setFilter(EMPTY_FILTER)}>
            Сбросить фильтр
          </button>
        </Show>
      </section>

      <section class="page__columns">
        <p class="page__note">
          Колонки: флажок прячет, стрелки двигают, ⇤ и ⇥ прижимают к краям, ⊞ собирает строки в
          группы. Ширину тянут за правый край заголовка — или стрелками с клавиатуры, Enter
          возвращает как было. Заголовок сортирует; с shift ключи копятся.
        </p>
        <ColumnControls columns={COLUMNS} view={view()} onViewChange={setView} />
        <Show when={view().grouping.length > 0}>
          <GroupControls session={session()} onSessionChange={setSession} />
        </Show>
      </section>

      <section class="page__rows">
        <p class="page__note">
          <span data-cell="missing">поля нет</span> и <span data-cell="empty">поле пустое</span>{" "}
          показаны по-разному: на отсутствующем поле условие отвечает «неизвестно», а не «нет».
          Подсвечены ячейки полей, которые участвуют в фильтре. По ячейке можно щёлкнуть — или
          дойти до неё стрелками.
        </p>

        <div class="page__scroll">
          <DataTable
            columns={COLUMNS}
            rows={result().rows}
            view={view()}
            onViewChange={setView}
            session={session()}
            onSessionChange={setSession}
            rowId={rowId}
            caption="Заявки"
            selectable
            totals
            onCellClick={setTouched}
            cellAttrs={(cell) => ({ highlighted: filtered().has(cell.column.name) })}
          />
        </div>

        <TablePager
          total={result().rows.length}
          view={view()}
          onViewChange={setView}
          session={session()}
          onSessionChange={setSession}
        />

        <Show when={touched()}>
          {(cell) => (
            <p class="page__touched">
              Ячейка: «{cell().column.label}» — {cell().present ? `«${cell().text}»` : "поля нет"} ·
              строка {cell().rowIndex + 1}
            </p>
          )}
        </Show>

        <Show when={result().rows.length === 0 && !result().error}>
          <p class="page__empty">Ни одна строка не подошла. Счётчики у условий показывают, где отсеклось.</p>
        </Show>
      </section>

      <section class="page__state">
        <p class="page__note">
          Состояние вида — данные с версией формата: его можно сохранить и вернуть. Состояние
          сеанса (страница, раскрытые группы, выделение) намеренно рядом, но НЕ сохраняется.
        </p>
        <pre class="page__json">{JSON.stringify(view(), null, 2)}</pre>
      </section>
    </div>
  );
}
