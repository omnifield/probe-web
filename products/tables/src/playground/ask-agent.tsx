// «Опиши отбор словами» — запрос к агенту.
//
// Сервиса за маршрутом ПОКА НЕТ, и интерфейс обязан это пережить: внятное «пока недоступно»
// вместо повисшей кнопки или белого экрана. Отсюда три состояния кнопки — ждём · пришло ·
// отказ — и ни одного необработанного исключения (`agent.ts` не бросает ничего).
//
// Ответ агента — ТАКОЙ ЖЕ чужой ввод, как файл переходника: между ним и таблицей стоит
// `parseFilter`. Модель ошибается ровно там, где человек не проверяет.

import { createSignal, Show } from "solid-js";

import { parseFilter } from "../filters/index.js";
import { askAgent } from "./agent.js";
import type { Stand } from "./stand.js";

type Phase = "idle" | "asking" | "failed" | "done";

export interface AskAgentProps {
  stand: Stand;
  /** Удался запрос — отдаём его текст наверх как ЗАГОТОВКУ имени для сохранения. */
  onAnswered?: (text: string) => void;
  /** Чем спрашивать; подменяется в пробах. */
  ask?: typeof askAgent;
}

export function AskAgent(props: AskAgentProps) {
  const [text, setText] = createSignal("");
  const [phase, setPhase] = createSignal<Phase>("idle");
  const [said, setSaid] = createSignal<string | null>(null);

  const run = async (): Promise<void> => {
    setPhase("asking");
    setSaid(null);

    const answer = await (props.ask ?? askAgent)(text());

    if (!answer.ok) {
      setPhase("failed");
      setSaid(answer.error);
      return;
    }

    // Пришло состояние — но чужое: проверяем тем же разбором, что и сохранённое.
    const parsed = parseFilter(answer.state);
    if (!parsed.ok) {
      setPhase("failed");
      setSaid(`Агент прислал отбор, который не читается: ${parsed.error}`);
      return;
    }

    props.stand.setFilter(parsed.state);
    setPhase("done");
    setSaid("Отбор собран — проверь условия ниже, их можно править.");
    props.onAnswered?.(text());
  };

  return (
    <section class="page__ask" data-stand="ask-agent" data-phase={phase()}>
      <h2 class="page__side-title">Спросить агента</h2>

      <textarea
        class="page__ask-text"
        rows={2}
        placeholder="крупные заявки без паспорта, кроме отменённых"
        aria-label="Опиши отбор словами"
        value={text()}
        disabled={phase() === "asking"}
        onInput={(event) => setText(event.currentTarget.value)}
      />

      <button
        type="button"
        class="page__ask-run"
        disabled={phase() === "asking" || text().trim() === ""}
        onClick={() => void run()}
      >
        {phase() === "asking" ? "Спрашиваем…" : "Собрать отбор"}
      </button>

      <Show when={said()}>
        {(message) => (
          <p class="page__ask-said" data-failed={phase() === "failed" ? "" : undefined} role="status">
            {message()}
          </p>
        )}
      </Show>
    </section>
  );
}
