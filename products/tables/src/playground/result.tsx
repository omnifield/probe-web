// ПОКАЗ — общая нижняя половина каждой страницы: переключатель «таблицей ↔ графиком», строка
// итога и сам показ.
//
// Один блок на все три страницы, а не три похожих: страницы разговаривают о разном (переходник,
// вид таблицы, отбор), но показывают ОДНО И ТО ЖЕ — результат отбора. Три копии этого блока
// разъехались бы на первой правке, и стенд начал бы показывать разное в зависимости от того,
// на какой странице стоишь.
//
// Оформление живёт ЗДЕСЬ, в потребителе: компоненты безголовые и ни одного класса не привозят.

import { For, Show } from "solid-js";

import { Chart, ChartLegend, type ChartSpec } from "../chart/index.js";
import { EMPTY_FILTER } from "../filters/index.js";
import {
  DataTable,
  GroupControls,
  HiddenColumns,
  TablePager,
  visibleColumns,
} from "../table/index.js";
import { COLUMNS } from "./data.js";
import { rowId, type Stand } from "./stand.js";

/**
 * Переключатель показа. Стоит на каждой странице — это и есть её вторая половина: о чём бы
 * страница ни была, посмотреть результат можно обоими способами.
 */
export function ViewSwitch(props: { stand: Stand }): ReturnType<typeof Show> {
  return (
    <div class="page__stand-block" data-stand="view-switch">
      <span class="page__stand-title">показать</span>
      <div class="page__choices">
        <label class="page__choice">
          <input
            type="radio"
            name="shown"
            checked={props.stand.shown() === "table"}
            onChange={() => props.stand.setShown("table")}
          />
          таблицей
        </label>
        <label class="page__choice">
          <input
            type="radio"
            name="shown"
            checked={props.stand.shown() === "chart"}
            onChange={() => props.stand.setShown("chart")}
          />
          графиком
        </label>
      </div>
    </div>
  );
}

/** Настройка графика: вид, срез, мера, серии. Показывается только когда показ — графиком. */
function ChartControls(props: { stand: Stand }): ReturnType<typeof Show> {
  return (
    <div class="page__chart-controls">
      <label>
        вид
        <select
          value={props.stand.chart().mark}
          onChange={(event) =>
            props.stand.setChart((current) => ({
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
          value={props.stand.chart().slice}
          onChange={(event) =>
            props.stand.setChart((current) => ({ ...current, slice: event.currentTarget.value }))
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
          value={`${props.stand.chart().measure.aggregate}:${props.stand.chart().measure.field ?? ""}`}
          onChange={(event) => {
            const [aggregate, field] = event.currentTarget.value.split(":");
            props.stand.setChart((current) => ({
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
          value={props.stand.chart().series ?? ""}
          onChange={(event) => {
            const value = event.currentTarget.value;
            props.stand.setChart((current) => ({
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
  );
}

/**
 * Показ результата: строка итога и дальше таблица или график.
 *
 * @param props.stand общее состояние стенда
 */
export function StandResult(props: { stand: Stand }): ReturnType<typeof Show> {
  return (
    <>
      <section class="page__stand" data-stand="result-head">
        <ViewSwitch stand={props.stand} />

        <div class="page__stand-block page__result">
          <span class="page__stand-title">результат</span>
          <p class="page__count">
            Отобрано <strong>{props.stand.result().rows.length}</strong> из {props.stand.rows().length}
            <Show when={props.stand.shown() === "table"}>
              {" · колонок "}
              {visibleColumns(COLUMNS, props.stand.view()).length} из {COLUMNS.length} · выделено{" "}
              {props.stand.session().selected.length}
            </Show>
          </p>
          <Show when={props.stand.result().error}>
            {(error) => <p class="page__error">Фильтр не применён: {error()}</p>}
          </Show>
          <Show when={props.stand.filter().conditions.length > 0}>
            <p class="page__phrase">{props.stand.phrase()}</p>
            <button
              type="button"
              class="page__reset"
              onClick={() => props.stand.setFilter(EMPTY_FILTER)}
            >
              Сбросить фильтр
            </button>
          </Show>
        </div>
      </section>

      <Show when={props.stand.shown() === "chart"}>
        <section class="page__chart" data-stand="chart">
          <ChartControls stand={props.stand} />

          <p class="page__note">
            Щелчок по величине — не «график управляет таблицей», а условие, добавленное в тот же
            отбор: переключись на таблицу и увидишь его там же.
          </p>

          <Chart
            columns={COLUMNS}
            rows={props.stand.result().rows}
            spec={props.stand.chart()}
            width={760}
            height={260}
            title="Заявки"
            onSelect={props.stand.pick}
            selected={props.stand.picked()}
          />
          <ChartLegend columns={COLUMNS} rows={props.stand.result().rows} spec={props.stand.chart()} />
        </section>
      </Show>

      <Show when={props.stand.shown() === "table"}>
        <section class="page__rows" data-stand="table">
          <p class="page__note">
            Управление колонкой — в самой колонке, под названием: ← → двигают, ⇤ ⇥ прижимают к
            краям, ⊞ собирает строки в группы, ✕ скрывает. Заголовок сортирует, с shift ключи
            копятся. Ширину тянут за правый край заголовка — или стрелками с клавиатуры.
          </p>
          <p class="page__note">
            <span data-cell="missing">поля нет</span> и <span data-cell="empty">поле пустое</span>{" "}
            показаны по-разному: на отсутствующем поле условие отвечает «неизвестно», а не «нет».
            Подсвечены ячейки полей, участвующих в отборе.
          </p>

          {/* Единственное, чему нет места в самой колонке: колонки на экране уже нет. */}
          <HiddenColumns columns={COLUMNS} view={props.stand.view()} onViewChange={props.stand.setView} />

          <Show when={props.stand.view().grouping.length > 0}>
            <GroupControls session={props.stand.session()} onSessionChange={props.stand.setSession} />
          </Show>

          <div class="page__scroll">
            <DataTable
              columnMenu
              columns={COLUMNS}
              rows={props.stand.result().rows}
              view={props.stand.view()}
              onViewChange={props.stand.setView}
              session={props.stand.session()}
              onSessionChange={props.stand.setSession}
              rowId={rowId}
              caption="Заявки"
              selectable
              totals
              onCellClick={props.stand.setTouched}
              cellAttrs={(cell) => ({ highlighted: props.stand.filtered().has(cell.column.name) })}
            />
          </div>

          <TablePager
            total={props.stand.result().rows.length}
            view={props.stand.view()}
            onViewChange={props.stand.setView}
            session={props.stand.session()}
            onSessionChange={props.stand.setSession}
          />

          <Show when={props.stand.touched()}>
            {(cell) => (
              <p class="page__touched">
                Ячейка: «{cell().column.label}» — {cell().present ? `«${cell().text}»` : "поля нет"}{" "}
                · строка {cell().rowIndex + 1}
              </p>
            )}
          </Show>
        </section>
      </Show>

      <Show when={props.stand.result().rows.length === 0 && !props.stand.result().error}>
        <p class="page__empty">
          Ни одна строка не подошла. Счётчики у условий показывают, где отсеклось.
        </p>
      </Show>
    </>
  );
}
