// КОНСОЛЬ СОБЫТИЙ — что дерево сказало наружу, живьём (`PWEB-157`).
//
// Пустая колонка, пока не случилось ни одного события, — честно, не заглушкой: событий не было,
// и говорить об этом нечего, тем же приёмом, что у панели настроек без объявленных настроек.

import { For, Show } from "solid-js";

import type { ConsoleState } from "../model/console.js";

export function EventConsole(props: { console: ConsoleState }) {
  return (
    <aside class="events">
      <div class="events__head">
        <b class="events__title">События</b>
        <button
          type="button"
          class="events__clear"
          disabled={props.console.events().length === 0}
          onClick={() => props.console.clear()}
        >
          очистить
        </button>
      </div>

      <Show
        when={props.console.events().length > 0}
        fallback={<p class="events__empty">кликните по компоненту на витрине — событие появится здесь</p>}
      >
        <ul class="events__list">
          <For each={props.console.events()}>
            {(event) => (
              <li class="events__item">
                <div class="events__row">
                  <b class="events__name">{event.name}</b>
                  <span class="events__address">{event.address}</span>
                </div>
                <Show when={Object.keys(event.context).length > 0}>
                  <pre class="events__context">{JSON.stringify(event.context)}</pre>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </aside>
  );
}
