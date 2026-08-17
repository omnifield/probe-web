// Стенд зоны `skin` — РАСКЛАДКА. Содержимое панели вида живёт в `knobs-panel.tsx`, кейсы — в
// `cases/`; здесь только то, где что стоит и что прокручивается.
//
// ТРИ КОЛОНКИ, каждая со своим скроллом (решение user 2026-08-17):
//
//   ┌──────────────┬──────────────────────────┬──────────────┐
//   │ компоненты   │ кейсы                    │ настройки    │
//   │ по группам   │                          │ вида         │
//   └──────────────┴──────────────────────────┴──────────────┘
//
// Полосы вкладок сверху больше нет: тридцать с лишним семейств в неё не влезали, занимали три
// строки и отжимали содержимое вниз. Список слева растёт вертикально — там место есть, и группы
// читаются столбцом лучше, чем вперемешку в строку.
//
// ОБЕ КОЛОНКИ СХЛОПЫВАЮТСЯ. Когда смотришь на компонент, ни список, ни ручки не нужны, а место
// нужно — плотные поверхности требуют ширины. Схлопнутая колонка оставляет узкую полосу с
// кнопкой: видно, что она есть, и возврат в один щелчок. Убирать её совсем нельзя — тогда
// способ вернуть придётся угадывать.
//
// ЧТО ГДЕ ПОКАЗЫВАЕТСЯ:
//   • «Всё» — витрина: по одному базовому кейсу на семейство, разделами по группам;
//   • семейство — только его кейсы, каждый с подписью и пояснением, зачем случай показан.

import { createSignal, For, Show } from "solid-js";

import { byGroup, GROUPS, SPECIMENS } from "./cases/index.js";
import { createKnobs } from "./knobs.js";
import { Knobs } from "./knobs-panel.jsx";

const ALL = "all";

export function App() {
  const knobs = createKnobs();
  const [tab, setTab] = createSignal<string>(ALL);
  const [left, setLeft] = createSignal(true);
  const [right, setRight] = createSignal(true);

  const current = () => SPECIMENS.find((s) => s.id === tab());

  return (
    <div class="shell" data-left={left() ? "on" : "off"} data-right={right() ? "on" : "off"}>
      {/* ── компоненты ────────────────────────────────────────────────────────────────── */}
      <aside class="rail rail--left">
        <div class="rail__bar">
          <button
            class="rail__toggle"
            type="button"
            aria-expanded={left()}
            aria-label={left() ? "Свернуть список компонентов" : "Показать список компонентов"}
            onClick={() => setLeft(!left())}
          >
            {left() ? "‹" : "›"}
          </button>
          <Show when={left()}>
            <span class="rail__title">
              Стенд зоны <b>skin</b>
            </span>
          </Show>
        </div>

        <Show when={left()}>
          <nav class="rail__body" aria-label="Компоненты">
            <button
              class="pick"
              type="button"
              aria-current={tab() === ALL ? "true" : undefined}
              onClick={() => setTab(ALL)}
            >
              Всё
            </button>

            <For each={GROUPS}>
              {(group) => (
                <div class="pick__group">
                  <span class="rail__label">{group}</span>
                  <For each={byGroup(group)}>
                    {(specimen) => (
                      <button
                        class="pick"
                        type="button"
                        aria-current={tab() === specimen.id ? "true" : undefined}
                        onClick={() => setTab(specimen.id)}
                      >
                        {specimen.title}
                      </button>
                    )}
                  </For>
                </div>
              )}
            </For>
          </nav>
        </Show>
      </aside>

      {/* ── содержимое ────────────────────────────────────────────────────────────────── */}
      <main class="stage">
        <header class="stage__head">
          <h1 class="stage__title">{current()?.title ?? "Всё"}</h1>
          {/* Перечень зацепок стоит у заголовка семейства: видно, за что цепляется оформление, и
              сразу заметно, если часть показана, а зацепка не покрыта. */}
          <Show when={current()}>
            <span class="stage__slots">
              <For each={current()?.slots ?? []}>{(slot) => <code>{slot}</code>}</For>
            </span>
          </Show>
        </header>

        <div class="scroll">
          <Show when={tab() === ALL} fallback={<CasePage />}>
            <div class="showcase">
              <For each={GROUPS}>
                {(group) => (
                  <section class="showcase__group">
                    <h2 class="showcase__title">{group}</h2>
                    <div class="grid">
                      <For each={byGroup(group)}>
                        {(specimen) => (
                          <section class="card">
                            <header class="card__head">
                              <h3>{specimen.title}</h3>
                              <button
                                class="card__more"
                                type="button"
                                onClick={() => setTab(specimen.id)}
                              >
                                кейсы →
                              </button>
                            </header>
                            <div class="card__body">{specimen.cases[0]?.render()}</div>
                          </section>
                        )}
                      </For>
                    </div>
                  </section>
                )}
              </For>
            </div>
          </Show>
        </div>
      </main>

      {/* ── настройки вида ────────────────────────────────────────────────────────────── */}
      <aside class="rail rail--right">
        <div class="rail__bar">
          <button
            class="rail__toggle"
            type="button"
            aria-expanded={right()}
            aria-label={right() ? "Свернуть настройки вида" : "Показать настройки вида"}
            onClick={() => setRight(!right())}
          >
            {right() ? "›" : "‹"}
          </button>
          <Show when={right()}>
            <span class="rail__title">Вид</span>
          </Show>
        </div>

        <Show when={right()}>
          <div class="rail__body">
            <Knobs knobs={knobs} />
          </div>
        </Show>
      </aside>
    </div>
  );

  /** Страница семейства: только кейсы, каждый со своим заголовком и пояснением. */
  function CasePage() {
    return (
      <div class="cases">
        <For each={current()?.cases ?? []}>
          {(item) => (
            <section class="case" id={`${current()?.id}-${item.id}`}>
              <header class="case__head">
                <h2>{item.title}</h2>
                <Show when={item.note}>
                  <p class="case__note">{item.note}</p>
                </Show>
              </header>
              <div class="case__body">{item.render()}</div>
            </section>
          )}
        </For>
      </div>
    );
  }
}
