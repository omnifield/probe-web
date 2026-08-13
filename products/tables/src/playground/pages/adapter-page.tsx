// Страница «Переходник»: чужая форма на входе — наш канон на выходе.
//
// Здесь и только здесь выбирается форма данных: разговор про вход не смешивается с разговором
// про отбор. Всё, что ниже конструктора, — общий показ, тот же самый, что на второй странице.

import { For, Show } from "solid-js";

import { AdapterBuilder } from "../../adapter/index.js";
import { COLUMNS, SOURCES } from "../data.js";
import { StandResult } from "../result.jsx";
import type { Stand } from "../stand.js";

export function AdapterPage(props: { stand: Stand }) {
  return (
    <>
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
                    checked={props.stand.source().id === one.id}
                    onChange={() => props.stand.setSourceId(one.id)}
                  />
                  {one.label}
                </label>
              )}
            </For>
          </div>
          <p class="page__hint">{props.stand.source().hint}</p>
        </div>

        <div class="page__stand-block">
          <span class="page__stand-title">что доехало</span>
          {/* Ничего не выбрасываем молча: непонятое считается и показывается. */}
          <p class="page__hint">
            прочитано {props.stand.adapted().report.total}, доехало {props.stand.adapted().report.converted}
            <Show when={props.stand.adapted().report.rejected > 0}>
              , забраковано {props.stand.adapted().report.rejected}
            </Show>
            <Show when={props.stand.adapted().report.issues.length > 0}>
              {" · не легло: "}
              {props.stand
                .adapted()
                .report.issues.map((issue) => `${issue.target} — ${issue.count}`)
                .join(", ")}
            </Show>
          </p>
          <Show when={props.stand.adapted().error}>{(error) => <p class="page__error">{error()}</p>}</Show>
        </div>
      </section>

      <section class="page__adapter">
        <AdapterBuilder
          fields={COLUMNS}
          sample={props.stand.source().response}
          spec={props.stand.adapter()}
          onChange={props.stand.setAdapter}
        />
      </section>

      <StandResult stand={props.stand} />
    </>
  );
}
