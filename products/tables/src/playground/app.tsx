// ОБОЛОЧКА демостенда: навигация, заголовок текущей страницы и общее состояние.
//
// Не витрина (витрина это зона `studio`) и не эталон. Стенд показывает ровно одно утверждение:
// **чужая форма приводится к канону на входе, и дальше всё работает одинаково**. Поэтому
// источники нарочно разные — свой канон, старый бэк, плоская выгрузка, вложенный ответ, — а
// отбор, таблица и график про их различия ничего не знают.
//
// Разрезано на СТРАНИЦЫ (решение user 2026-08-13): один экран на всё превращал стенд в
// простыню, где три разговора идут одновременно и ни один не виден целиком. Разрезан при этом
// экран, а не данные: состояние одно на весь стенд (`stand.ts`), и переход между страницами
// ничего не сбрасывает.
//
// Оформление живёт ЗДЕСЬ, в потребителе: компоненты безголовые и ни одного класса не привозят.

import { For, Match, onMount, Show, Switch } from "solid-js";

import { AdapterPage } from "./pages/adapter-page.jsx";
import { FiltersPage } from "./pages/filters-page.jsx";
import type { StandStore } from "./remote-store.js";
import { createRoute, PAGES, pageMeta } from "./route.js";
import { createSaved } from "./saved.js";
import { Sidebar } from "./sidebar.jsx";
import { createStand } from "./stand.js";

export interface AppProps {
  /** Хранилище пресетов; по умолчанию наш сервис с откатом в память. В пробах подменяется. */
  store?: StandStore;
}

export function App(props: AppProps = {}) {
  const stand = createStand();
  const route = createRoute();
  const meta = () => pageMeta(route.page());

  const saved = props.store === undefined ? createSaved(stand) : createSaved(stand, props.store);

  // Список тянем один раз на старте. Сервиса может не быть — тогда `saved` сам съедет в память
  // и скажет об этом; падать тут нечему.
  onMount(() => void saved.refresh());

  /** Кейсы — про отбор, поэтому стоят только там, где отбор настраивают. */
  const withCases = () => route.page() === "filters";

  return (
    <div class="page">
      {/* Шапка одна на все страницы и НЕ ездит: в ней только имя стенда и переходы. Заголовок
          и объяснение страницы уехали в содержимое — иначе шапка меняла бы высоту при каждом
          переходе, и всё под ней прыгало бы. */}
      <header class="page__head">
        <h1>Стенд зоны tables</h1>

        {/* Ссылки, а не кнопки: адрес страницы настоящий — им делятся, и кнопка «назад»
            работает сама. Переход всё равно перехватываем сигналом, чтобы не ждать события. */}
        <nav class="page__nav" aria-label="Страницы стенда">
          <For each={PAGES}>
            {(page) => (
              <a
                class="page__nav-link"
                href={page.hash}
                aria-current={route.page() === page.id ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  route.go(page.id);
                }}
              >
                {page.nav}
              </a>
            )}
          </For>
        </nav>
      </header>

      {/* Две области со СВОИМ скроллом: страница целиком не прокручивается, поэтому шапка,
          кейсы и содержимое не уезжают друг относительно друга. */}
      <div class="page__body" data-side={withCases() ? "cases" : "none"}>
        <Show when={withCases()}>
          <Sidebar stand={stand} saved={saved} />
        </Show>

        <main class="page__main">
          <section class="page__block page__intro">
            <h2 class="page__title">{meta().title}</h2>
            <p class="page__lead">{meta().lead}</p>
          </section>

          <Switch>
            <Match when={route.page() === "adapter"}>
              <AdapterPage stand={stand} />
            </Match>
            <Match when={route.page() === "filters"}>
              <FiltersPage stand={stand} />
            </Match>
          </Switch>
        </main>
      </div>
    </div>
  );
}
