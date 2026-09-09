// Корень дерева маршрутов — без разметки: хром витрины (`WorkspaceLayout`) переехал в pathless
// layout `_workspace.tsx`, чтобы у `/embed/...` (без хрома, для агента) был путь мимо него —
// корень с хромом внутри не позволял ветке маршрутов остаться голой. Разбор — ROADMAP.yaml,
// пункт `embed-routes-for-agent-playground`.
import { createRootRoute, Outlet } from "@web-core/router";
import { TanStackRouterDevtools } from "@web-core/router/devtools";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
