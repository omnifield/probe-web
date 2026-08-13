// Блок под таблицей: ВОТ ЧТО МЫ ПРИШЛЁМ БЭКУ.
//
// Просьба user: бэк должен видеть запрос до того, как напишет приём. Договор на словах («ну там
// условия и логика») расходится молча — текст с параметрами не расходится.
//
// Здесь ничего не считается заново: `filterToSql` берёт тот же отбор, что применён к таблице,
// `viewToSql` — тот же порядок и ту же страницу. Второй расчёт «специально для показа» разошёлся
// бы с настоящим, и разошёлся бы именно тогда, когда по нему уже написали бэк.
//
// Запрос показан, но НИКУДА НЕ УХОДИТ: отбор, порядок и страница считаются на клиенте — весь
// набор лежит в памяти. Это сказано на экране, чтобы блок не читался как «уже работает».
//
// Блок стоит и под таблицей, и под графиком, и запрос у них РАЗНЫЙ — в этом половина смысла
// показа. Отбор один и тот же, а хвост разный: таблице нужны строки (порядок и страница),
// графику — уже сведённые величины (`GROUP BY`). Показывать бэку только табличный вариант
// значило бы умолчать про сведение, а его как раз и придётся однажды унести на сервер.

import { createMemo, createSignal, For, Show } from "solid-js";

import { chartToSql } from "../chart/index.js";
import { filterToSql, type SqlDialect } from "../filters/index.js";
import { viewToSql } from "../table/index.js";
import { COLUMNS } from "./data.js";
import type { Stand } from "./stand.js";

/** Таблица бэка — догадка стенда: у нас её имени нет и взяться ему неоткуда. */
const TABLE = "applications";

export function SqlView(props: { stand: Stand }) {
  const [dialect, setDialect] = createSignal<SqlDialect>("standard");
  const [copied, setCopied] = createSignal(false);

  const query = createMemo(() => {
    const filter = filterToSql(props.stand.filter(), {
      table: TABLE,
      dialect: dialect(),
      fields: COLUMNS,
    });

    if (props.stand.shown() === "chart") {
      const chart = chartToSql(props.stand.chart(), { dialect: dialect() });
      const text = [
        chart.select,
        `FROM ${TABLE}`,
        filter.where === "" ? "" : `WHERE ${filter.where}`,
        chart.groupBy,
        chart.order,
      ]
        .filter((part) => part !== "")
        .join("\n");

      return { text, params: filter.params, notes: [...filter.notes, ...chart.notes] };
    }

    const tail = viewToSql(props.stand.view(), props.stand.session(), { dialect: dialect() });
    const text = [filter.text, tail.order, tail.page].filter((part) => part !== "").join("\n");
    return { text, params: filter.params, notes: [...filter.notes, ...tail.notes] };
  });

  const copy = async (): Promise<void> => {
    // Копирование — удобство, и его отсутствие не должно ронять блок: буфера может не быть
    // (нет разрешения, не защищённый источник), и это нормальный отказ, а не поломка.
    try {
      await navigator.clipboard.writeText(query().text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section class="page__sql" data-stand="sql">
      <div class="page__sql-head">
        <h3 class="page__side-title">Запрос, который поедет на бэк</h3>

        <label class="page__choice">
          диалект
          <select
            value={dialect()}
            onChange={(event) => setDialect(event.currentTarget.value as SqlDialect)}
          >
            <option value="standard">свод (?, JSON_VALUE)</option>
            <option value="postgres">PostgreSQL ($1, -&gt;&gt;)</option>
          </select>
        </label>

        <button type="button" class="page__sql-copy" onClick={() => void copy()}>
          {copied() ? "скопировано" : "скопировать"}
        </button>
      </div>

      <p class="page__note">
        Пока НИКУДА НЕ УХОДИТ: отбор, порядок и страница считаются здесь, весь набор в памяти.
        Это показ договора — чтобы приём написали под то, что мы действительно пришлём.
      </p>

      <pre class="page__sql-text" data-stand="sql-text">
        {query().text}
      </pre>

      <Show
        when={query().params.length > 0}
        fallback={<p class="page__note">Параметров нет: в отборе нет ни одного значения.</p>}
      >
        <ol class="page__sql-params" data-stand="sql-params">
          <For each={query().params}>
            {(value, index) => (
              <li>
                <span class="page__sql-place">
                  {dialect() === "postgres" ? `$${index() + 1}` : `?${index() + 1}`}
                </span>
                <span class="page__sql-value">{value}</span>
              </li>
            )}
          </For>
        </ol>
      </Show>

      {/* Значения уезжают ПАРАМЕТРАМИ и никогда не вклеиваются в текст: вклеенное значение —
          это внедрение, а не форматирование. */}
      <Show when={query().notes.length > 0}>
        <ul class="page__sql-notes">
          <For each={query().notes}>{(note) => <li>{note}</li>}</For>
        </ul>
      </Show>
    </section>
  );
}
