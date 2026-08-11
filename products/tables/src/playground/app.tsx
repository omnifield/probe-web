// ДЕМОСТЕНД зоны: выбираешь форму данных — подставляется её переходник; ставишь отбор —
// и смотришь результат таблицей или графиком.
//
// Не витрина (витрина это зона `studio`) и не эталон. Здесь показывается ровно одно
// утверждение: **чужая форма приводится к канону на входе, и дальше всё работает одинаково**.
// Поэтому источники нарочно разные — свой канон, старый бэк, плоская выгрузка, вложенный
// ответ, — а отбор, таблица и график про их различия ничего не знают.
//
// Оформление живёт ЗДЕСЬ, в потребителе: компоненты безголовые и ни одного класса не привозят.

import { createMemo, createSignal, For, Show } from "solid-js";

import { AdapterBuilder, type AdapterSpec, applyAdapter } from "../adapter/index.js";
import {
  Chart,
  ChartLegend,
  type ChartSelection,
  type ChartSpec,
  selectionCondition,
  seriesCondition,
} from "../chart/index.js";
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
import { COLUMNS, PRESETS, SOURCES, TEMPLATES } from "./data.js";

const LABELS = labelsOf(COLUMNS);

/** Поля, которые участвуют в условии, — по ним подсвечиваются ячейки. */
function fieldsOf(condition: Condition): FieldRef[] {
  return condition.kind === "presence" ? condition.fields : [condition.field];
}

/** Тождество строки: данные локальные, поэтому годится заявитель или агент. */
function rowId(row: Record<string, unknown>, index: number): string {
  return String(row["applicant"] ?? row["agent"] ?? index);
}

const START_CHART: ChartSpec = {
  version: 1,
  mark: "bar",
  slice: "/region",
  measure: { field: "/amount", aggregate: "sum" },
  order: "value-desc",
};

export function App() {
  const [sourceId, setSourceId] = createSignal(SOURCES[0]!.id);
  const source = createMemo(() => SOURCES.find((one) => one.id === sourceId()) ?? SOURCES[0]!);

  // Правки переходника держим ПО ИСТОЧНИКУ: переключился туда-обратно — настройка на месте.
  const [edited, setEdited] = createSignal<Record<string, AdapterSpec>>({});
  const adapter = createMemo(() => edited()[sourceId()] ?? source().adapter);
  const setAdapter = (next: AdapterSpec) =>
    setEdited((current) => ({ ...current, [sourceId()]: next }));

  const adapted = createMemo(() => applyAdapter(source().response, adapter()));
  const rows = createMemo(() => adapted().rows);

  const [filter, setFilter] = createSignal<FilterState>(EMPTY_FILTER);
  const [chart, setChart] = createSignal<ChartSpec>(START_CHART);
  const [view, setView] = createSignal<ViewState>({ ...EMPTY_VIEW, pageSize: 10 });
  const [session, setSession] = createSignal<SessionState>(EMPTY_SESSION);
  const [shown, setShown] = createSignal<"table" | "chart">("table");
  const [showAdapter, setShowAdapter] = createSignal(false);
  const [touched, setTouched] = createSignal<CellContext | null>(null);

  const result = createMemo(() => applyFilter(rows(), filter(), { fields: COLUMNS }));
  const phrase = createMemo(() => describeFilter(filter(), LABELS));
  const filtered = createMemo(() => new Set(filter().conditions.flatMap(fieldsOf)));

  const picked = createMemo(() =>
    filter()
      .conditions.filter(
        (condition) => condition.kind === "compare" && condition.field === chart().slice,
      )
      .map((condition) => (condition.kind === "compare" ? condition.value : "")),
  );

  /** Выделение на графике — запрос к данным: клик кладёт условие в тот же отбор. */
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
        <h1>Демостенд: данные · отбор · показ</h1>
        <p class="page__lead">
          Выбирается форма, в которой приходят данные, — к ней подставляется свой переходник.
          Всё остальное про эти различия не знает: один словарь полей, один язык отбора, два
          способа показать.
        </p>
      </header>

      <section class="page__stand">
        <div class="page__stand-block">
          <span class="page__stand-title">форма данных</span>
          <div class="page__choices">
            <For each={SOURCES}>
              {(one) => (
                <label class="page__choice" title={one.hint}>
                  <input
                    type="radio"
                    name="source"
                    checked={sourceId() === one.id}
                    onChange={() => setSourceId(one.id)}
                  />
                  {one.label}
                </label>
              )}
            </For>
          </div>
          <p class="page__hint">{source().hint}</p>
        </div>

        <div class="page__stand-block">
          <span class="page__stand-title">показать</span>
          <div class="page__choices">
            <label class="page__choice">
              <input
                type="radio"
                name="shown"
                checked={shown() === "table"}
                onChange={() => setShown("table")}
              />
              таблицей
            </label>
            <label class="page__choice">
              <input
                type="radio"
                name="shown"
                checked={shown() === "chart"}
                onChange={() => setShown("chart")}
              />
              графиком
            </label>
          </div>
        </div>

        <div class="page__stand-block">
          <span class="page__stand-title">переходник</span>
          <label class="page__choice">
            <input
              type="checkbox"
              checked={showAdapter()}
              onChange={(event) => setShowAdapter(event.currentTarget.checked)}
            />
            показать настройку
          </label>
          <p class="page__hint">
            прочитано {adapted().report.total}, доехало {adapted().report.converted}
            <Show when={adapted().report.rejected > 0}>
              , забраковано {adapted().report.rejected}
            </Show>
            <Show when={adapted().report.issues.length > 0}>
              {" · не легло: "}
              {adapted()
                .report.issues.map((issue) => `${issue.target} — ${issue.count}`)
                .join(", ")}
            </Show>
          </p>
          <Show when={adapted().error}>{(error) => <p class="page__error">{error()}</p>}</Show>
        </div>
      </section>

      <Show when={showAdapter()}>
        <section class="page__adapter">
          <AdapterBuilder
            fields={COLUMNS}
            sample={source().response}
            spec={adapter()}
            onChange={setAdapter}
          />
        </section>
      </Show>

      <section class="page__panel">
        <FilterBuilder
          fields={COLUMNS}
          rows={rows()}
          state={filter()}
          onChange={setFilter}
          presets={PRESETS}
          templates={TEMPLATES}
        />
      </section>

      <section class="page__summary">
        <p class="page__phrase">{phrase()}</p>
        <p class="page__count">
          Отобрано <strong>{result().rows.length}</strong> из {rows().length}
          <Show when={shown() === "table"}>
            {" · колонок "}
            {visibleColumns(COLUMNS, view()).length} из {COLUMNS.length} · выделено{" "}
            {session().selected.length}
          </Show>
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

      <Show when={shown() === "chart"}>
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
                <For
                  each={COLUMNS.filter(
                    (column) => column.type === "text" || column.type === "bool",
                  )}
                >
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
            отбор: переключись на таблицу и увидишь его там же.
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
      </Show>

      <Show when={shown() === "table"}>
        <section class="page__columns">
          <p class="page__note">
            Колонки: флажок прячет, стрелки двигают, ⇤ и ⇥ прижимают к краям, ⊞ собирает строки
            в группы. Ширину тянут за правый край заголовка. Заголовок сортирует; с shift ключи
            копятся.
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
            Подсвечены ячейки полей, участвующих в отборе.
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
                Ячейка: «{cell().column.label}» — {cell().present ? `«${cell().text}»` : "поля нет"}{" "}
                · строка {cell().rowIndex + 1}
              </p>
            )}
          </Show>
        </section>
      </Show>

      <Show when={result().rows.length === 0 && !result().error}>
        <p class="page__empty">
          Ни одна строка не подошла. Счётчики у условий показывают, где отсеклось.
        </p>
      </Show>
    </div>
  );
}
