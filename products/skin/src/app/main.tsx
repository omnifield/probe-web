// Точка входа приложения.
//
// Порядок тот же, что у скелета потребителя: базовый слой значений, затем `mount` из зоны
// `runtime`.
//
// СВОЕГО ОФОРМЛЕНИЯ У ЗОНЫ БОЛЬШЕ НЕТ (решение user 2026-08-27): экраны собраны из настоящих
// компонентов кита, одетых нарядом — тем же самым, который они и показывают. Второго слоя вида
// рядом с китом не заводим: был бы виден нарядом кита и своими классами разом, и они разошлись бы
// на первой же правке одного без другого.
//
// НАДЕВАЕМОЙ ПАЛИТРЫ ФРЕЙМВОРК БОЛЬШЕ НЕ ВЕЗЁТ, и это верно: палитра без рецептов — половина
// скина, а половин у скина не бывает. Базовый слой остаётся: он снимает браузерные умолчания и
// объявляет способность страницы к обеим половинам. Цвет приходит со скином — или не приходит
// вовсе, и тогда кит голый.
//
// РОУТЕР И КВЕРИ ПОДКЛЮЧЕНЫ (`PWEB-173`, итерация 1) — точка сборки приложения теперь корневой
// маршрут (`routes/__root.tsx`), `app/app.tsx` снят как избыточный слой между ними (его работу —
// строить `browse`/`wearing`/консоль и рисовать `WorkspaceLayout` — делает `routes/
// _workspace.tsx`). `QueryClientProvider` стоит СНАРУЖИ `RouterProvider`, как и показывает README
// `@omnifield/probe-web-query` — данных по сети витрина сегодня не тянет ни одной, клиент заведён
// как стандартный скелет, на будущее.

import "@omnifield/probe-web-style/base.css";

import { mount } from "@omnifield/probe-web-runtime";
import { QueryClient, QueryClientProvider } from "@omnifield/probe-web-query";
import { RouterProvider } from "@omnifield/probe-web-router";

import { router } from "../router.js";

const queryClient = new QueryClient();

mount(() => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
));
