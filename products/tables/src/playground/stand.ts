// Состояние стенда — ОДНО на все страницы.
//
// `rows` — фиксированный канон (`data.ts`'s `ROWS`): страница «Переходник» снята вместе с
// `src/adapter/` (постановка user, 2026-08-29 — переходник переехал в `packages/io`, PWEB-180..
// 183), выбора формы данных на стенде сегодня нет.
//
// Здесь же лежит связка «график ↔ отбор»: щелчок по величине кладёт условие в тот же фильтр.
// Отдельной механики «график управляет таблицей» не существует — обе смотрят в одно состояние.
//
// Здесь же лежит связка «график ↔ отбор»: щелчок по величине кладёт условие в тот же фильтр.
// Отдельной механики «график управляет таблицей» не существует — обе смотрят в одно состояние.

import { type Accessor, createMemo, createSignal, type Setter } from "solid-js";

import {
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
  type FilterState,
  labelsOf,
  type Row,
} from "../filters/index.js";
import {
  type CellContext,
  EMPTY_SESSION,
  EMPTY_VIEW,
  type SessionState,
  type ViewState,
} from "../table/index.js";
import { COLUMNS, ROWS } from "./data.js";
import { trace } from "./trace.js";

const LABELS = labelsOf(COLUMNS);

/** Чем показываем отобранное. Переключатель есть на КАЖДОЙ странице — это её вторая половина. */
export type Shown = "table" | "chart";

const START_CHART: ChartSpec = {
  version: 1,
  mark: "bar",
  slice: "/region",
  measure: { field: "/amount", aggregate: "sum" },
  order: "value-desc",
};

/** Поля, которые участвуют в условии, — по ним подсвечиваются ячейки. */
function fieldsOf(condition: Condition): FieldRef[] {
  return condition.kind === "presence" ? condition.fields : [condition.field];
}

/** Тождество строки: данные локальные, поэтому годится заявитель или агент. */
export function rowId(row: Record<string, unknown>, index: number): string {
  return String(row["applicant"] ?? row["agent"] ?? index);
}

/** Что вернул отбор: строки и ошибка разбора формулы, если она есть. */
export interface Selected {
  rows: Row[];
  error: string | null;
}

export interface Stand {
  rows: Accessor<Row[]>;

  filter: Accessor<FilterState>;
  setFilter: Setter<FilterState>;
  /** Отбор, применённый к строкам: то, что видят и таблица, и график. */
  result: Accessor<Selected>;
  /** Отбор словами — «сумма больше 500 000 И статус равно в работе». */
  phrase: Accessor<string>;
  /** Поля, участвующие в отборе: по ним таблица подсвечивает ячейки. */
  filtered: Accessor<Set<string>>;

  chart: Accessor<ChartSpec>;
  setChart: Setter<ChartSpec>;
  /** Величины графика, уже отобранные условиями, — их он показывает выделенными. */
  picked: Accessor<string[]>;
  /** Щелчок по величине: выделение — это запрос к данным, поэтому кладём условие в отбор. */
  pick(selection: ChartSelection): void;

  view: Accessor<ViewState>;
  setView: Setter<ViewState>;
  session: Accessor<SessionState>;
  setSession: Setter<SessionState>;

  shown: Accessor<Shown>;
  setShown: Setter<Shown>;
  touched: Accessor<CellContext | null>;
  setTouched: Setter<CellContext | null>;
}

/**
 * Заводит состояние стенда. Зовётся ОДИН раз в оболочке: страницы получают его сверху и своего
 * не заводят — иначе переход между страницами молча сбрасывал бы отбор и настройку переходника.
 *
 * @returns состояние стенда целиком
 */
export function createStand(): Stand {
  const rows = () => ROWS;

  const [filter, setFilter] = createSignal<FilterState>(EMPTY_FILTER);
  const [chart, setChart] = createSignal<ChartSpec>(START_CHART);
  const [view, setView] = createSignal<ViewState>({ ...EMPTY_VIEW, pageSize: 10 });
  const [session, setSession] = createSignal<SessionState>(EMPTY_SESSION);
  const [shown, setShown] = createSignal<Shown>("table");
  const [touched, setTouched] = createSignal<CellContext | null>(null);

  const result = createMemo(() => {
    const done = trace("result");
    const applied = applyFilter(rows(), filter(), { fields: COLUMNS });
    done(`${applied.rows.length} из ${rows().length}`);
    return applied;
  });

  const phrase = createMemo(() => describeFilter(filter(), LABELS));
  const filtered = createMemo(() => new Set(filter().conditions.flatMap(fieldsOf)));

  const picked = createMemo(() =>
    filter()
      .conditions.filter(
        (condition) => condition.kind === "compare" && condition.field === chart().slice,
      )
      .map((condition) => (condition.kind === "compare" ? condition.value : "")),
  );

  return {
    rows,

    filter,
    setFilter,
    result,
    phrase,
    filtered,

    chart,
    setChart,
    picked,
    pick: (selection) => {
      const conditions = [
        selectionCondition(chart(), selection),
        seriesCondition(chart(), selection),
      ].filter((condition) => condition !== null);

      if (conditions.length === 0) return;
      setFilter((current) => ({ ...current, conditions: [...current.conditions, ...conditions] }));
    },

    view,
    setView,
    session,
    setSession,

    shown,
    setShown,
    touched,
    setTouched,
  };
}
