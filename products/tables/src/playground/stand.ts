// Состояние стенда — ОДНО на все страницы.
//
// Страницы разные, данные одни: выбрал источник на «Переходнике», поставил условие на
// «Фильтрах», ушёл на «Таблицу» — и там тот же набор строк, тот же отбор. Разрезали ЭКРАН, а
// не данные: три состояния, живущие по страницам, разъехались бы, и стенд перестал бы
// показывать то единственное, ради чего он есть, — что всё стоит на одном словаре полей.
//
// Здесь же лежит связка «график ↔ отбор»: щелчок по величине кладёт условие в тот же фильтр.
// Отдельной механики «график управляет таблицей» не существует — обе смотрят в одно состояние.

import { type Accessor, createMemo, createSignal, type Setter } from "solid-js";

import { type Adapted, type AdapterSpec, applyAdapter } from "../adapter/index.js";
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
import { COLUMNS, type DemoSource, SOURCES } from "./data.js";
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
  /** Выбранная форма данных на входе. */
  source: Accessor<DemoSource>;
  setSourceId(id: string): void;
  /** Переходник выбранного источника — свой у каждого, правки не перетекают. */
  adapter: Accessor<AdapterSpec>;
  setAdapter(next: AdapterSpec): void;
  /** Что приехало после переходника: строки, отчёт о непонятом, ошибка разбора. */
  adapted: Accessor<Adapted>;
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
  const [sourceId, setSourceId] = createSignal(SOURCES[0]!.id);
  const source = createMemo(() => SOURCES.find((one) => one.id === sourceId()) ?? SOURCES[0]!);

  // Правки переходника держим ПО ИСТОЧНИКУ: переключился туда-обратно — настройка на месте.
  const [edited, setEdited] = createSignal<Record<string, AdapterSpec>>({});
  const adapter = createMemo(() => edited()[sourceId()] ?? source().adapter);

  const adapted = createMemo(() => applyAdapter(source().response, adapter()));
  const rows = createMemo(() => adapted().rows);

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
    source,
    setSourceId: (id) => setSourceId(id),
    adapter,
    setAdapter: (next) => setEdited((current) => ({ ...current, [sourceId()]: next })),
    adapted,
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
