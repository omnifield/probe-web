// Смоук-проба зоны: не «опции разобрались», а настоящий рендер и настоящая навигация —
// то, что действительно ловит сломанный реэкспорт или разъехавшийся конкретный вендор.
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  defaultRouterOptions,
  Link,
  Outlet,
  RouterProvider,
} from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function buildRouter(initialPath: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <div>
        <Link to="/about">to-about</Link>
        <Outlet />
      </div>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <p>home</p>,
  });
  const aboutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/about",
    component: () => <p>about</p>,
  });
  const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

  return createRouter({
    ...defaultRouterOptions,
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

describe("@web-core/router", () => {
  it("реэкспорт держит дефолты и рендерит дерево маршрутов", async () => {
    expect(defaultRouterOptions.defaultPreload).toBe("intent");

    const router = buildRouter("/");
    await router.load();

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RouterProvider router={router} />, host);

    expect(host.textContent).toContain("home");
  });

  it("навигация меняет смонтированное дерево", async () => {
    const router = buildRouter("/");
    await router.load();

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RouterProvider router={router} />, host);

    await router.navigate({ to: "/about" });

    expect(host.textContent).toContain("about");
    expect(host.textContent).not.toContain("home");
  });
});
