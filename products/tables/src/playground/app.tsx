// Площадка зоны — место, где фильтр и таблицу можно потрогать руками. Не витрина (витрина
// это зона `studio`) и не эталон: здесь проверяется UX, поэтому оформление живёт ЗДЕСЬ, в
// потребителе, а не в компонентах — они безголовые и ни одного класса не привозят.

import { createMemo, createSignal, For, Show } from "solid-js";

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
  Chart,
  ChartLegend,
  type ChartSpec,
  type ChartSelection,
  selectionCondition,
  seriesCondition,
} from "../chart/index.js";
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
import {
  AdapterBuilder,
  type AdapterSpec,
  applyAdapter,
} from "../adapter/index.js";
import { COLUMNS, FOREIGN_ADAPTER, FOREIGN_RESPONSE, PRESETS, ROWS, TEMPLATES } from "./data.js";

const LABELS = labelsOf(COLUMNS);

/** Поля, которые участвуют в условии, — по ним подсвечиваются ячейки. */
function fieldsOf(condition: Condition): FieldRef[] {
  return condition.kind === "presence" ? condition.fields : [condition.field];
}

/** Тождество строки: на площадке данные локальные, поэтому годится заявитель или агент. */
function rowId(row: Record<string, unknown>, index: number): string {
  return String(row["applicant"] ?? row["agent"] ?? index);
}

/** Начальный график: сколько заявок по регионам. Меняется прямо на площадке. */
const START_CHART: ChartSpec = {
  version: 1,
  mark: "bar",
  slice: "/region",
  measure: { field: "/amount", aggregate: "sum" },
  order: "value-desc",
};

export function App() {
  const [filter, setFilter] = createSignal<FilterState>(EMPTY_FILTER);
  const [chart, setChart] = createSignal<ChartSpec>(START_CHART);
  const [view, setView] = createSignal<ViewState>({ ...EMPTY_VIEW, pageSize: 10 });
  const [session, setSession] = createSignal<SessionState>(EMPTY_SESSION);
  const [touched, setTouched] = createSignal<CellContext | null>(null);
  const [foreign, setForeign] = createSignal(false);
  const [adapter, setAdapter] = createSignal<AdapterSpec>(FOREIGN_ADAPTER);

  /** Данные, на которых стоит вся площадка: свои — или чужие, пропущенные через переходник. */
  const adapted = createMemo(() => applyAdapter(FOREIGN_RESPONSE, adapter()));
  const source = createMemo(() => (foreign() ? adapted().rows : ROWS));

  // Словарь полей отдаётся вычислителю: без него «сумма больше 90000» сравнивалась бы текстом,
  // а «заведена до 01.07» вообще не имела бы смысла.
  const result = createMemo(() => applyFilter(source(), filter(), { fields: COLUMNS }));
  const phrase = createMemo(() => describeFilter(filter(), LABELS));

  const filtered = createMemo(() => new Set(filter().conditions.flatMap(fieldsOf)));

  /** Что на графике уже отобрано: значения условий по полю среза. */
  const picked = createMemo(() =>
    filter()
      .conditions.filter(
        (condition) => condition.kind === "compare" && condition.field === chart().slice,
      )
      .map((condition) => (condition.kind === "compare" ? condition.value : "")),
  );

  /**
   * Выделение на графике — ЗАПРОС К ДАННЫМ: клик добавляет условие в тот же фильтр, который
   * читает таблица. Отдельной механики «график управляет таблицей» здесь нет и не нужно.
   */
  const pick = (selection: ChartSelection): void => {
    const conditions = [
      selectionCondition(chart(), selection),
      seriesCondition(chart(), selection),
    ].filter((condition) => condition !== null);

    if (conditions.length === 0) return;
    setFilter((current) => ({ ...current, conditions: [...current.conditions, ...conditions] }));
  };

  return (
    <div class="page">
      <header class="page__head">
        <h1>Фильтры и таблица — площадка</h1>
        <p class="page__lead">
          Один словарь полей на отбор и на показ. Данные локальные, набор полей у строк разный,
          контакты лежат вложенно.
        </p>
      </header>

      <section class="page__adapter">
        <label class="page__switch">
          <input
            type="checkbox"
            checked={foreign()}
            onChange={(event) => setForeign(event.currentTarget.checked)}
          />
          показать чужой бэк через переходник
        </label>

        <Show when={foreign()}>
          <p class="page__note">
            Данные приходят в чужой форме: набор завёрнут, имя и фамилия врозь, сумма в
            копейках строкой, дата в виде дд.мм.гггг, статус кодом. Переходник — отдельный
            файл: правила ниже собираются мышкой, и ниже же видно, что не легло.
          </p>
          <AdapterBuilder
            fields={COLUMNS}
            sample={FOREIGN_RESPONSE}
            spec={adapter()}
            onChange={setAdapter}
          />
        </Show>
      </section>

      <section class="page__panel">
        <FilterBuilder
          fields={COLUMNS}
          rows={source()}
          state={filter()}
          onChange={setFilter}
          presets={PRESETS}
          templates={TEMPLATES}
        />
      </section>

      <section class="page__summary">
        <p class="page__phrase">{phrase()}</p>
        <p class="page__count">
          Отобрано <strong>{result().rows.length}</strong> из {source().length} · колонок{" "}
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

      <section class="page__chart">
        <div class="page__chart-controls">
          <label>
            вид
            <select
              value={chart().mark}
              onChange={(event) =>
                setChart((current) => ({
                  ...current,
                  mark: event.currentTarget.value as ChartSpec["mark"],
                }))
              }
            >
              <option value="bar">столбики</option>
              <option value="line">линия</option>
              <option value="point">точки</option>
            </select>
          </label>

          <label>
            срез
            <select
              value={chart().slice}
              onChange={(event) =>
                setChart((current) => ({ ...current, slice: event.currentTarget.value }))
              }
            >
              <For each={COLUMNS.filter((column) => column.type === "text" || column.type === "bool")}>
                {(column) => <option value={column.name}>{column.label}</option>}
              </For>
            </select>
          </label>

          <label>
            мера
            <select
              value={`${chart().measure.aggregate}:${chart().measure.field ?? ""}`}
              onChange={(event) => {
                const [aggregate, field] = event.currentTarget.value.split(":");
                setChart((current) => ({
                  ...current,
                  measure: {
                    aggregate: aggregate as ChartSpec["measure"]["aggregate"],
                    ...(field === "" ? {} : { field }),
                  },
                }));
              }}
            >
              <option value="count:">сколько заявок</option>
              <option value="sum:/amount">сумма</option>
              <option value="average:/amount">средняя сумма</option>
              <option value="average:/score">средний рейтинг</option>
              <option value="countdistinct:/status">различных статусов</option>
            </select>
          </label>

          <label>
            серии
            <select
              value={chart().series ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setChart((current) => ({
                  ...current,
                  ...(value === "" ? { series: undefined } : { series: value }),
                }));
              }}
            >
              <option value="">без разбивки</option>
              <option value="/status">по статусу</option>
              <option value="/urgent">по срочности</option>
            </select>
          </label>
        </div>

        <p class="page__note">
          Щелчок по величине — не «график управляет таблицей», а условие, добавленное в тот же
          фильтр: и таблица, и сам график читают одно состояние отбора.
        </p>

        <Chart
          columns={COLUMNS}
          rows={result().rows}
          spec={chart()}
          width={760}
          height={260}
          title="Заявки"
          onSelect={pick}
          selected={picked()}
        />
        <ChartLegend columns={COLUMNS} rows={result().rows} spec={chart()} />
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
