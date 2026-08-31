// Маршрут стенда — СВОЙ, на хеше, ноль зависимостей.
//
// Почему не `@solidjs/router` (канон Solid, сверено 2026-08-13): маршрутизатор — зависимость
// В ПОСТАВКУ, а такое решение принимает architect, не зона (shared-policy). Здесь же нужен не
// маршрутизатор, а три адреса без параметров, вложенности и защит — на этом объёме своя
// разборка адреса дешевле чужой зависимости и не тянет её в потребителя.
//
// Хеш, а не `history.pushState`, по той же причине дешевизны: хеш работает на статике без
// единой настройки сервера, а стенд именно так и раздаётся (`vite preview`, любой файл-сервер).
//
// Модуль БЕЗ JSX намеренно: разбор адреса — чистая функция, и проверяется он пробой на строках,
// а не рендером.

import { type Accessor, createSignal, onCleanup } from "solid-js";

import { trace } from "./trace.js";

/**
 * Страница стенда.
 *
 * Страница «Переходник» снята вместе с `src/adapter/` (постановка user, 2026-08-29 — переходник
 * данных переехал в `packages/io`, PWEB-180..183). Осталась одна: «таблица» отдельной страницей
 * и раньше не заводилась намеренно (решение user 2026-08-13) — управление колонками живёт В
 * САМОЙ КОЛОНКЕ, под её названием.
 */
export type PageId = "filters";

export interface PageMeta {
  id: PageId;
  /** Адрес страницы целиком, вместе с `#`. */
  hash: string;
  /** Подпись в навигации — короткая. */
  nav: string;
  /** Заголовок страницы. */
  title: string;
  /** Что именно эта страница показывает. */
  lead: string;
}

/**
 * Состав стенда — ДАННЫЕ, а не три ветки `if`. Отсюда навигацию рисует цикл, а не руки:
 * добавится страница — она появится в навигации сама, и забыть её будет негде.
 */
export const PAGES: readonly PageMeta[] = [
  {
    id: "filters",
    hash: "#/filters",
    nav: "Фильтры",
    title: "Фильтры: плоский список условий и строка логики",
    lead:
      "Трёхзначная логика — истина, ложь, неизвестно; отбор пропускает только истину. " +
      "Счётчик у условия показывает, сколько оно оставляет и сколько не смогло решить.",
  },
];

/** Адрес, на который встаёт стенд, когда в строке адреса нет ничего годного. */
export const START: PageId = "filters";

/** Метаданные страницы по её идентификатору. */
export function pageMeta(id: PageId): PageMeta {
  return PAGES.find((page) => page.id === id) ?? PAGES[0]!;
}

/** Адрес страницы — единственное место, где он собирается. */
export function hashOf(id: PageId): string {
  return pageMeta(id).hash;
}

/**
 * Разбирает строку адреса в страницу.
 *
 * Неизвестный адрес — НЕ ошибка и не пустой экран: стенд встаёт на стартовую страницу. Чужая
 * ссылка с опечаткой или обрезанный хвост не должны выглядеть как поломка стенда.
 *
 * @param hash значение `location.hash` (с `#` или без — принимаются оба)
 * @returns страница; неизвестный или пустой адрес → {@link START}
 */
export function parseRoute(hash: string): PageId {
  // Отрезаем `#`, ведущие `/` и хвост запроса: адресуемся первым сегментом и только им.
  const path = hash.replace(/^#/, "").replace(/^\/+/, "").split(/[?#]/)[0] ?? "";
  const first = path.split("/")[0]?.trim().toLowerCase() ?? "";

  return PAGES.find((page) => page.id === first)?.id ?? START;
}

export interface Route {
  page: Accessor<PageId>;
  go(id: PageId): void;
}

/**
 * Заводит маршрут: читает адрес на старте и следит за его сменой (кнопка «назад» в браузере
 * тоже смена адреса, поэтому слушаем событие, а не только свои нажатия).
 *
 * @param target окно; по умолчанию глобальное. Вне DOM маршрут остаётся на {@link START}
 * @returns текущая страница и переход
 */
export function createRoute(target?: Window): Route {
  const view = target ?? (typeof window === "undefined" ? undefined : window);
  const [page, setPage] = createSignal<PageId>(view ? parseRoute(view.location.hash) : START);

  if (view) {
    const onHashChange = (): void => {
      const next = parseRoute(view.location.hash);
      const done = trace(`route(${next})`);
      setPage(next);
      done();
    };

    view.addEventListener("hashchange", onHashChange);
    onCleanup(() => view.removeEventListener("hashchange", onHashChange));
  }

  return {
    page,
    go: (id) => {
      // Сигнал ставим сами, а не ждём события: событие не приходит, когда адрес тот же самый.
      setPage(id);
      if (view) view.location.hash = hashOf(id);
    },
  };
}
