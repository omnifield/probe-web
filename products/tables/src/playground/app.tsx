// Площадка зоны — место, где фильтр можно потрогать руками. Не витрина (витрина это зона
// `studio`) и не эталон: здесь проверяется UX конструктора, поэтому вывод результата нарочно
// СЫРОЙ — обычная разметка, а не наш компонент таблицы. Таблица приедет отдельно.

import { createMemo, createSignal, For, Show } from "solid-js";

import {
  applyFilter,
  describeFilter,
  EMPTY_FILTER,
  type FieldLabels,
  FilterBuilder,
  type FilterState,
  hasField,
  isFilled,
} from "../filters/index.js";
import { FIELDS, PRESETS, ROWS, TEMPLATES } from "./data.js";

const LABELS: FieldLabels = Object.fromEntries(FIELDS.map((field) => [field.name, field.label]));

export function App() {
  const [filter, setFilter] = createSignal<FilterState>(EMPTY_FILTER);

  const result = createMemo(() => applyFilter(ROWS, filter()));
  const phrase = createMemo(() => describeFilter(filter(), LABELS));

  return (
    <div class="page">
      <header class="page__head">
        <h1>Фильтры — площадка</h1>
        <p class="page__lead">
          Плоский список условий плюс отдельная строка логики. Вложенных групп нет намеренно.
          Данные локальные, набор полей у строк разный.
        </p>
      </header>

      <section class="page__panel">
        <FilterBuilder
          fields={FIELDS}
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
          Показано <strong>{result().rows.length}</strong> из {ROWS.length}
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

      <section class="page__rows">
        <p class="page__note">
          Сырой вывод, а не компонент таблицы: <span data-cell="missing">поля нет</span> и{" "}
          <span data-cell="empty">поле пустое</span> показаны по-разному — фильтр их различает.
        </p>
        <div class="page__scroll">
          <table>
            <thead>
              <tr>
                <For each={FIELDS}>{(field) => <th>{field.label}</th>}</For>
              </tr>
            </thead>
            <tbody>
              <For each={result().rows}>
                {(row) => (
                  <tr>
                    <For each={FIELDS}>
                      {(field) => (
                        <td
                          data-cell={
                            !hasField(row, field.name)
                              ? "missing"
                              : isFilled(row, field.name)
                                ? "filled"
                                : "empty"
                          }
                        >
                          {!hasField(row, field.name)
                            ? "нет поля"
                            : isFilled(row, field.name)
                              ? String(row[field.name])
                              : "пусто"}
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
        <Show when={result().rows.length === 0 && !result().error}>
          <p class="page__empty">Ни одна строка не подошла. Счётчики у условий показывают, где отсеклось.</p>
        </Show>
      </section>
    </div>
  );
}
