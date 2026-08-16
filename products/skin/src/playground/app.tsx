// Стенд зоны `skin` по модели, которую user выбрал ориентиром (Radix Themes playground):
// панель ручек слева, образцы справа, переключение «главное / все состояния» и вкладки по
// примитивам.
//
// Стенд показывает ДВА утверждения сразу:
//
//   1. **Оформление подключается и снимается отдельно** — тумблер «Оформление» добавляет и
//      удаляет наш CSS живьём. Снял — остались голые примитивы кита, ровно как без нас
//      (kb:PROBEWEB-11, правило первое).
//   2. **Вид настраивается значениями, а не переписыванием правил** — ручка «Радиус» меняет
//      ОДИН токен `--radius`, а вся шкала скруглений производная от него.
//
// Чего здесь пока НЕТ и почему: ручек «акцент», «серый», «плотность» и «размер». Для них нужны
// цветовые шкалы и шкала интервалов, которых в слое `style` сегодня нет; заявка принята,
// правки делаются. Заглушку, которая крутится и ничего не меняет, не ставлю — она врёт.

import { createSignal, For, onCleanup, Show } from "solid-js";

// `?inline` — Vite отдаёт содержимое строкой и НЕ подключает его к странице сам. У потребителя
// форма другая: обычный `import "@probe-web/skin/skin.css"` один раз на бутстрапе. Импорт снять
// живьём нельзя, а стенд обязан показать именно снятие.
import skinCss from "../skin/skin.css?inline";
import { SPECIMENS } from "./specimens.jsx";

const STYLE_ID = "probe-web-skin";

/** Ступени радиуса. Значение уезжает в `--radius`, шкала `--radius-*` считается из него в `style`. */
const RADIUS_STEPS = [
  { id: "none", label: "нет", value: "0rem" },
  { id: "small", label: "малый", value: "0.25rem" },
  { id: "medium", label: "средний", value: "0.5rem" },
  { id: "large", label: "крупный", value: "0.75rem" },
  { id: "full", label: "полный", value: "1.5rem" },
] as const;

type ViewMode = "main" | "states";

/** Ставит и снимает оформление одним и тем же тегом: снятие обязано возвращать исходный кит. */
function useSkin() {
  const [dressed, setDressed] = createSignal(true);

  const apply = (on: boolean) => {
    const existing = document.getElementById(STYLE_ID);
    if (on) {
      if (existing) return;
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = skinCss;
      document.head.appendChild(el);
    } else {
      existing?.remove();
    }
  };

  apply(true);

  // Горячая перезагрузка пересоздаёт площадку: тег обязан уйти вместе с ней, иначе их станет два.
  onCleanup(() => document.getElementById(STYLE_ID)?.remove());

  return {
    dressed,
    toggle: () => {
      const next = !dressed();
      setDressed(next);
      apply(next);
    },
  };
}

/** Тема — класс `dark` на `<html>`, ровно как у потребителя. Оформление про неё не знает. */
function useMode() {
  const root = document.documentElement;
  const [dark, setDark] = createSignal(root.classList.contains("dark"));

  return {
    dark,
    toggle: () => {
      const next = !dark();
      setDark(next);
      root.classList.toggle("dark", next);
    },
  };
}

export function App() {
  const skin = useSkin();
  const mode = useMode();

  const [radius, setRadius] = createSignal<string>("medium");
  const [view, setView] = createSignal<ViewMode>("main");
  const [tab, setTab] = createSignal<string>("all");

  const radiusValue = () => RADIUS_STEPS.find((s) => s.id === radius())?.value ?? "0.5rem";
  const shown = () => (tab() === "all" ? SPECIMENS : SPECIMENS.filter((s) => s.id === tab()));

  return (
    <div class="shell">
      {/* ПАНЕЛЬ РУЧЕК. Значения уезжают в переменные на контейнере образцов, а не в правила
          оформления: скин остаётся тем же файлом, меняются только токены под ним. */}
      <aside class="panel">
        <h1 class="panel__title">
          Стенд зоны <b>skin</b>
        </h1>

        <div class="panel__group">
          <span class="panel__label">Оформление</span>
          <div class="panel__row">
            <button
              class="chip"
              type="button"
              aria-pressed={skin.dressed()}
              onClick={skin.toggle}
            >
              {skin.dressed() ? "подключено" : "снято"}
            </button>
          </div>
          <p class="panel__hint">
            Снимите — останется голый кит. Это рабочее состояние примитивов, а не поломка.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Тема</span>
          <div class="panel__row">
            <button class="chip" type="button" aria-pressed={!mode.dark()} onClick={mode.toggle}>
              светлая
            </button>
            <button class="chip" type="button" aria-pressed={mode.dark()} onClick={mode.toggle}>
              тёмная
            </button>
          </div>
        </div>

        <div class="panel__group">
          <span class="panel__label">Радиус</span>
          <div class="panel__row">
            <For each={RADIUS_STEPS}>
              {(step) => (
                <button
                  class="chip"
                  type="button"
                  aria-pressed={radius() === step.id}
                  onClick={() => setRadius(step.id)}
                >
                  {step.label}
                </button>
              )}
            </For>
          </div>
          <p class="panel__hint">
            Меняется один токен <code>--radius</code> — вся шкала скруглений производная от него.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Показ</span>
          <div class="panel__row">
            <button
              class="chip"
              type="button"
              aria-pressed={view() === "main"}
              onClick={() => setView("main")}
            >
              главное
            </button>
            <button
              class="chip"
              type="button"
              aria-pressed={view() === "states"}
              onClick={() => setView("states")}
            >
              все состояния
            </button>
          </div>
          <p class="panel__hint">
            Наведение и фокус не подделываются: проверяются мышью и клавишей Tab.
          </p>
        </div>

        <div class="panel__group panel__group--pending">
          <span class="panel__label">Скоро</span>
          <p class="panel__hint">
            Акцент, серый и плотность появятся, когда в слой <code>style</code> приедут цветовые
            шкалы и шкала интервалов. Ручка, которая крутится и ничего не меняет, здесь не стоит.
          </p>
        </div>
      </aside>

      <main class="stage">
        <nav class="tabs" aria-label="Примитивы">
          <button class="tab" type="button" aria-pressed={tab() === "all"} onClick={() => setTab("all")}>
            Всё
          </button>
          <For each={SPECIMENS}>
            {(specimen) => (
              <button
                class="tab"
                type="button"
                aria-pressed={tab() === specimen.id}
                onClick={() => setTab(specimen.id)}
              >
                {specimen.title}
              </button>
            )}
          </For>
        </nav>

        {/* Токены-ручки живут ЗДЕСЬ, на контейнере образцов, а не на `<html>`: так видно, что
            оформление настраивается переопределением переменных в любом поддереве, и панель
            стенда остаётся в своём виде независимо от того, что накручено. */}
        <div class="specimens" style={{ "--radius": radiusValue() }}>
          <For each={shown()}>
            {(specimen) => (
              <section class="specimen">
                <header class="specimen__head">
                  <h2>{specimen.title}</h2>
                  <span class="specimen__slots">
                    <For each={specimen.slots}>{(slot) => <code>{slot}</code>}</For>
                  </span>
                </header>

                <div class="specimen__row">
                  <Show when={view() === "main" || !specimen.states} fallback={specimen.states?.()}>
                    {specimen.main()}
                  </Show>
                </div>

                <Show when={view() === "states" && !specimen.states}>
                  <p class="specimen__note">
                    У этого примитива нет состояний, выраженных атрибутами.
                  </p>
                </Show>
              </section>
            )}
          </For>
        </div>
      </main>
    </div>
  );
}
