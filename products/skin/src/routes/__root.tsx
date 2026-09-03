// Корневой маршрут витрины (`PWEB-173`, итерация 1).
//
// СВОЕЙ РАСКЛАДКИ ЗДЕСЬ НЕТ И НЕ БУДЕТ — она в `pages/index.tsx`, прямым JSX поверх
// `Workspace` (`PWEB-161`). Корень маршрута — чистый `Outlet`, ни навигации, ни хрома: тот же
// довод, что и раньше у `app.tsx` («второго слоя вида рядом с китом не заводим»), распространённый
// на роутер — он не первый автор разметки, он точка входа.
import { createRootRoute, Outlet } from "@omnifield/probe-web-router";
import { TanStackRouterDevtools } from "@omnifield/probe-web-router/devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
