// Корневой маршрут витрины — раскладка (`WorkspaceLayout`, `pages/index.tsx`) стоит здесь же,
// без обёрточного pathless-слоя: `pages/` не несёт слова «workspace» ни в одном имени
// (`index.tsx`/`lab/index.tsx`/`showcase/index.tsx`), `routes/` теперь зеркалит это один в один —
// `__root.tsx` и есть тот самый верх, как `pages/index.tsx`. `WorkspaceLayout` сам несёт свой
// `<Outlet/>` внутри (`WorkspaceMain`) — здесь его НЕ оборачивают, детей у него нет.
import { createRootRoute } from "@web-core/router";
import { TanStackRouterDevtools } from "@web-core/router/devtools";

import { WorkspaceLayout } from "../pages/index.jsx";

export const Route = createRootRoute({
  component: () => (
    <>
      <WorkspaceLayout />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  ),
});
