import {
  createRouter,
  defaultRouterOptions,
  RouterProvider as RouterProviderBase,
} from "@web-core/router";

import { componentStore } from "#/entities/component";
import { routeTree } from "#/routeTree.gen";

const router = createRouter({ ...defaultRouterOptions, routeTree });

declare module "@web-core/router" {
  interface Register {
    router: typeof router;
  }
}

router.subscribe("onResolved", () => {
  const match = router.state.matches.find(
    (one) => typeof (one.params as Record<string, unknown>).component === "string",
  );
  const component = (match?.params as Record<string, unknown> | undefined)?.component;
  if (typeof component === "string") componentStore.actions.setComponent(component);
});

export function RouterProvider() {
  return <RouterProviderBase router={router} />;
}
