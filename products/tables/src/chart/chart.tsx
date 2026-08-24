// График — БЕЗГОЛОВЫЙ, как и всё в ките (`PROBEWEB-4`).
//
// Рисуем СВОИМ SVG, а не библиотекой. Причина не в «сами умеем»: библиотека графиков — это
// зависимость В ПОСТАВКУ, а такое решение принимает architect, не зона; вдобавок рисующие
// слои везут своё оформление, и половина кита стала бы оформленной. Здесь ноль зависимостей:
// наружу едут структура, роли доступности и зацепки `data-slot`, а цвет и вид — за
// потребителем (`fill="currentColor"` — он и переопределяется). Разбор — `TABLES-7`.
//
// Доступность взята у нормы: WAI-ARIA Graphics Module 1.0 даёт ровно три роли —
// `graphics-document` (график целиком), `graphics-object` (серия) и `graphics-symbol`
// (отдельная величина). Это то, что позволяет вспомогательной технологии ПРОЙТИ график, а не
// увидеть непрозрачную картинку.

import { createMemo, For, Show } from "solid-js";

import { DEFAULT_LOCALE, formatValue, type Row } from "../dataset/index.js";
import type { ColumnDictionary, ColumnSpec } from "../table/index.js";
import { type ChartSpec, MARK_LABELS } from "./model.js";
import { bandScale, linearScale } from "./scale.js";
import type { ChartSelection } from "./select.js";
import { trace } from "./trace.js";
import { buildChart, type ChartPoint } from "./transform.js";

export interface ChartProps {
  /** Тот же словарь полей, что у таблицы: одна мера считается одинаково в обоих. */
  columns: ColumnDictionary;
  /** Строки ПОСЛЕ отбора: фильтр — ступень до графика, а не его часть. */
  rows: readonly Row[];
  spec: ChartSpec;
  width?: number;
  height?: number;
  locale?: string;
  /** Что читает вспомогательная технология вместо картинки. */
  title?: string;
  /** Клик или Enter по величине. Не передан — график не интерактивен и в обход не попадает. */
  onSelect?: (selection: ChartSelection) => void;
  /** Ключи выделенных категорий — чтобы показать, что отбор пришёл отсюда. */
  selected?: readonly string[];
}

const PADDING = { top: 12, right: 12, bottom: 44, left: 64 };

export function Chart(props: ChartProps) {
  const locale = () => props.locale ?? DEFAULT_LOCALE;
  const width = () => props.width ?? 640;
  const height = () => props.height ?? 280;
  const interactive = () => props.onSelect !== undefined;

  const data = createMemo(() => {
    const done = trace("buildChart");
    const built = buildChart(props.rows, props.spec, props.columns, locale());
    done(`категорий ${built.categories.length}, серий ${built.series.length}`);
    return built;
  });

  const measureColumn = createMemo<ColumnSpec | undefined>(() =>
    props.columns.find((column) => column.name === props.spec.measure.field),
  );

  const sliceLabel = () =>
    props.columns.find((column) => column.name === props.spec.slice)?.label ?? props.spec.slice;

  /** Величина словами: счётчики — обычным числом, остальное — форматом своего поля. */
  const say = (value: number | null): string => {
    if (value === null) return "нет значения";
    const column = measureColumn();
    const counting = props.spec.measure.aggregate === "count" || props.spec.measure.aggregate === "countdistinct";
    return counting || !column
      ? new Intl.NumberFormat(locale()).format(value)
      : formatValue(value, column, locale()).text;
  };

  const value = createMemo(() =>
    linearScale(data().min, data().max, [height() - PADDING.bottom, PADDING.top]),
  );

  const band = createMemo(() =>
    bandScale(data().categories.length, [PADDING.left, width() - PADDING.right]),
  );

  /** Полоса под одну серию внутри категории: столбики стоят рядом, а не друг на друге. */
  const seriesWidth = () => band().width / Math.max(1, data().series.length);

  const zero = () => value().at(Math.max(value().min, Math.min(0, value().max)));

  const isSelected = (key: string) => props.selected?.includes(key) ?? false;

  const pick = (point: ChartPoint, seriesKey: string, seriesLabel: string): void => {
    props.onSelect?.({
      key: point.key,
      label: point.label,
      ...(props.spec.series === undefined ? {} : { seriesKey, seriesLabel }),
    });
  };

  const summary = () =>
    `${MARK_LABELS[props.spec.mark]}: ${props.title ?? sliceLabel()}, категорий ${data().categories.length}` +
    (data().series.length > 1 ? `, серий ${data().series.length}` : "") +
    (data().missing > 0 ? `, без значения среза ${data().missing}` : "");

  return (
    <svg
      data-slot="chart"
      data-mark={props.spec.mark}
      viewBox={`0 0 ${width()} ${height()}`}
      width={width()}
      height={height()}
      // Роль нормирована: график — документ, в котором смысл несёт вид и раскладка.
      // Пишем через `attr:` — роли графики живут в ОТДЕЛЬНОМ модуле ARIA (Graphics Module
      // 1.0), и в наборе ролей, который знают типы Solid, их нет. Это не обход типов, а
      // единственный способ поставить нормированный атрибут, о котором типы не слышали.
      attr:role="graphics-document"
      aria-label={props.title ?? sliceLabel()}
    >
      <desc data-slot="chart-summary">{summary()}</desc>

      <Show when={data().empty}>
        <text data-slot="chart-empty" x={width() / 2} y={height() / 2} text-anchor="middle">
          Считать нечего
        </text>
      </Show>

      {/* Ось величин. Для вспомогательной технологии она шум: те же числа уже сказаны в
          подписи каждой величины, и повтор мешает пройти график. */}
      <g data-slot="chart-value-axis" aria-hidden="true">
        <For each={value().ticks(4)}>
          {(tick) => (
            <g data-slot="chart-tick" data-value={tick}>
              <line
                data-slot="chart-grid"
                x1={PADDING.left}
                x2={width() - PADDING.right}
                y1={value().at(tick)}
                y2={value().at(tick)}
                stroke="currentColor"
              />
              <text
                data-slot="chart-tick-label"
                x={PADDING.left - 8}
                y={value().at(tick)}
                text-anchor="end"
                dominant-baseline="middle"
              >
                {say(tick)}
              </text>
            </g>
          )}
        </For>
      </g>

      <g data-slot="chart-slice-axis" aria-hidden="true">
        <For each={data().categories}>
          {(category, index) => (
            <text
              data-slot="chart-slice-label"
              data-key={category.key}
              x={band().center(index())}
              y={height() - PADDING.bottom + 16}
              text-anchor="middle"
            >
              {category.label}
            </text>
          )}
        </For>
      </g>

      <For each={data().series}>
        {(series, seriesIndex) => (
          <g
            data-slot="chart-series"
            data-series={seriesIndex()}
            data-key={series.key}
            // Серия — отдельный объект со своим смыслом: это и есть `graphics-object`.
            attr:role="graphics-object"
            aria-label={series.label === "" ? MARK_LABELS[props.spec.mark] : `серия «${series.label}»`}
          >
            <Show when={props.spec.mark === "line" || props.spec.mark === "point"}>
              <Show when={props.spec.mark === "line"}>
                <path
                  data-slot="chart-line"
                  fill="none"
                  stroke="currentColor"
                  d={series.points
                    .map((point, index) =>
                      point.value === null
                        ? null
                        : `${band().center(index)},${value().at(point.value)}`,
                    )
                    .filter((piece): piece is string => piece !== null)
                    .map((piece, index) => `${index === 0 ? "M" : "L"}${piece}`)
                    .join(" ")}
                />
              </Show>
            </Show>

            <For each={series.points}>
              {(point, index) => {
                const label = () =>
                  `${point.label}: ${say(point.value)}` +
                  (series.label === "" ? "" : `, серия «${series.label}»`) +
                  (isSelected(point.key) ? ", выделено" : "");

                const common = {
                  "data-slot": "chart-mark",
                  "data-key": point.key,
                  "data-series": seriesIndex(),
                  "data-selected": isSelected(point.key) ? "" : undefined,
                  // `data-empty` здесь БЫЛО и было мёртвым: величина рисуется только когда
                  // значение есть (`Show` ниже), так что признак не мог выставиться никогда.
                  // Обещать его значило бы дать потребителю селектор, который не сработает.
                  // Пустое значение видно по тому, что величины на этом месте просто нет.
                  // Отдельная величина — простой смысл, где важен смысл, а не вид.
                  "attr:role": "graphics-symbol",
                  "aria-label": label(),
                  tabindex: interactive() ? 0 : undefined,
                  onClick: () => pick(point, series.key, series.label),
                  onKeyDown: (event: KeyboardEvent) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    pick(point, series.key, series.label);
                  },
                };

                return (
                  <Show when={point.value !== null}>
                    <Show
                      when={props.spec.mark === "bar"}
                      fallback={
                        <circle
                          {...common}
                          cx={band().center(index())}
                          cy={value().at(point.value!)}
                          r={4}
                          fill="currentColor"
                        />
                      }
                    >
                      <rect
                        {...common}
                        x={band().at(index()) + seriesIndex() * seriesWidth()}
                        y={Math.min(value().at(point.value!), zero())}
                        width={seriesWidth()}
                        height={Math.abs(zero() - value().at(point.value!))}
                        fill="currentColor"
                      />
                    </Show>
                  </Show>
                );
              }}
            </For>
          </g>
        )}
      </For>
    </svg>
  );
}

export interface ChartLegendProps {
  columns: ColumnDictionary;
  rows: readonly Row[];
  spec: ChartSpec;
  locale?: string;
  selected?: readonly string[];
  onSelect?: (selection: ChartSelection) => void;
}

/**
 * Легенда — отдельным списком, а не внутри картинки.
 *
 * Текст внутри SVG не переносится, не масштабируется вместе со страницей и хуже читается
 * вспомогательной технологией. Легенда — обычная разметка, и в ней те же зацепки и та же
 * `currentColor`, что у серий.
 */
export function ChartLegend(props: ChartLegendProps) {
  const data = createMemo(() =>
    buildChart(props.rows, props.spec, props.columns, props.locale ?? DEFAULT_LOCALE),
  );

  return (
    <Show when={props.spec.series !== undefined && data().series.length > 1}>
      <ul data-slot="chart-legend">
        <For each={data().series}>
          {(series, index) => (
            <li data-slot="chart-legend-item" data-series={index()} data-key={series.key}>
              <span data-slot="chart-legend-mark" aria-hidden="true" />
              {/* Метка отдельной зацепкой, а не голым текстом: её выравнивают и обрезают
                  отдельно от значка, и достать её через `chart-legend-item` нельзя. */}
              <span data-slot="chart-legend-label">{series.label}</span>
            </li>
          )}
        </For>
      </ul>
    </Show>
  );
}
