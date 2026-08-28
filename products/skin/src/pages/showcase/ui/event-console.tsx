// КОНСОЛЬ СОБЫТИЙ — что дерево сказало наружу, живьём (`PWEB-157`).
//
// Пустая колонка, пока не случилось ни одного события, — честно, не заглушкой: событий не было,
// и говорить об этом нечего, тем же приёмом, что у панели настроек без объявленных настроек.
//
// НАСТОЯЩИЙ КИТ (решение user 2026-08-27, `PWEB-161`): `Surface`+`Button`, тот же наряд, что и у
// остальной панели.

import { Button, Surface } from "@omnifield/probe-web-ui";
import { For, Show } from "solid-js";

import type { ConsoleState } from "../model/console.js";

export function EventConsole(props: { console: ConsoleState }) {
  return (
    <Surface as="aside" data-variant="raised" style={{ display: "flex", "flex-direction": "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between" }}>
        <b>События</b>
        <Button data-variant="tertiary" disabled={props.console.events().length === 0} onClick={() => props.console.clear()}>
          очистить
        </Button>
      </div>

      <Show when={props.console.events().length > 0} fallback={<span>кликните по компоненту на витрине — событие появится здесь</span>}>
        <ul style={{ display: "flex", "flex-direction": "column", gap: "var(--space-2)", "list-style": "none", margin: "0", padding: "0" }}>
          <For each={props.console.events()}>
            {(event) => (
              <li>
                <div style={{ display: "flex", "align-items": "baseline", gap: "var(--space-2)" }}>
                  <b>{event.name}</b>
                  <span>{event.address}</span>
                </div>
                <Show when={Object.keys(event.context).length > 0}>
                  <pre style={{ margin: "0" }}>{JSON.stringify(event.context)}</pre>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </Surface>
  );
}
