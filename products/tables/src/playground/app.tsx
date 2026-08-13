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

import { For, Match, Switch } from "solid-js";

import { AdapterPage } from "./pages/adapter-page.jsx";
import { FiltersPage } from "./pages/filters-page.jsx";
import { createRoute, PAGES, pageMeta } from "./route.js";
import { Sidebar } from "./sidebar.jsx";
import { createStand } from "./stand.js";

export function App() {
  const stand = createStand();
  const route = createRoute();
  const meta = () => pageMeta(route.page());

  return (
    <div class="page">
      <header class="page__head">
        <h1>Стенд зоны tables: данные · отбор · показ</h1>

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

        <h2 class="page__title">{meta().title}</h2>
        <p class="page__lead">{meta().lead}</p>
      </header>

      {/* Кейсы стоят слева и не уезжают вместе со страницей: они про то, ЧТО можно спросить
          у данных, а страница — про то, где это настраивают. */}
      <div class="page__body">
        <Sidebar stand={stand} route={route} />

        <main class="page__main">
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
