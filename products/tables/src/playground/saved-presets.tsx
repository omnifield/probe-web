// Сохранённые отборы: сохранить текущий, применить, удалить.
//
// Пресеты ОБЩИЕ (решение user): сохранённое видят все, кто открыл стенд, — и это сказано в
// интерфейсе прямо, чтобы человек не считал их своими. Ровно так же прямо говорится обратное:
// когда сервиса нет, отбор лёг только в эту вкладку, и молчать об этом нельзя.
//
// Имя обязательно, пояснение — нет: из списка выбирают по названию, а заставлять описывать
// очевидный отбор значит получить поле, забитое пробелом.

import { createSignal, For, Show } from "solid-js";

import type { Saved } from "./saved.js";
import type { Stand } from "./stand.js";

/** Когда сохранён — коротко; локаль та же, что у показа значений. */
const WHEN = new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" });

function when(iso: string): string {
  const parsed = new Date(iso);
  // Хранилище могло отдать что угодно: непонятную отметку показываем как есть, а не «Invalid Date».
  return Number.isNaN(parsed.getTime()) ? iso : WHEN.format(parsed);
}

export interface SavedPresetsProps {
  stand: Stand;
  saved: Saved;
  /** Заготовка имени — приезжает из запроса к агенту. */
  draftName: () => string;
  setDraftName: (next: string) => void;
}

export function SavedPresets(props: SavedPresetsProps) {
  const [hint, setHint] = createSignal("");

  const empty = () => props.stand.filter().conditions.length === 0;

  const store = async (): Promise<void> => {
    const done = await props.saved.save(props.draftName(), hint());
    if (!done) return;
    props.setDraftName("");
    setHint("");
  };

  return (
    <section class="page__saved" data-stand="saved">
      <h2 class="page__side-title">Сохранённые отборы</h2>

      <p class="page__side-lead">
        <Show
          when={props.saved.mode() === "service"}
          fallback="Хранилище недоступно — сохранённое живёт только в этой вкладке и уйдёт вместе с ней."
        >
          Общие: сохранённое видят все, кто открыл стенд.
        </Show>
      </p>

      <div class="page__save-form">
        <input
          class="page__save-name"
          type="text"
          placeholder="Название отбора"
          aria-label="Название отбора"
          value={props.draftName()}
          onInput={(event) => props.setDraftName(event.currentTarget.value)}
        />
        <input
          class="page__save-hint"
          type="text"
          placeholder="Пояснение — необязательно"
          aria-label="Пояснение к отбору"
          value={hint()}
          onInput={(event) => setHint(event.currentTarget.value)}
        />
        <button
          type="button"
          class="page__save-run"
          disabled={props.saved.busy() || empty() || props.draftName().trim() === ""}
          onClick={() => void store()}
        >
          Сохранить текущий отбор
        </button>
        <Show when={empty()}>
          <p class="page__side-lead">Сохранять пока нечего: ни одного условия не поставлено.</p>
        </Show>
      </div>

      <Show when={props.saved.notice()}>
        {(message) => (
          <p class="page__saved-notice" role="status">
            {message()}
          </p>
        )}
      </Show>

      <Show
        when={props.saved.items().length > 0}
        fallback={<p class="page__side-lead">Пока ничего не сохранено.</p>}
      >
        <ul class="page__cases" data-stand="saved-list">
          <For each={props.saved.items()}>
            {(item) => (
              <li data-saved={item.id}>
                <button
                  type="button"
                  class="page__case"
                  disabled={props.saved.busy()}
                  onClick={() => void props.saved.apply(item.id)}
                >
                  <span class="page__case-label">{item.label}</span>
                  <Show when={item.hint}>
                    {(text) => <span class="page__case-hint">{text()}</span>}
                  </Show>
                  <span class="page__case-count">сохранён {when(item.savedAt)}</span>
                </button>
                <button
                  type="button"
                  class="page__saved-drop"
                  aria-label={`Удалить отбор «${item.label}»`}
                  disabled={props.saved.busy()}
                  onClick={() => void props.saved.remove(item.id)}
                >
                  ✕
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  );
}
