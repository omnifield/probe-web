import {
  createRouter,
  defaultRouterOptions,
  RouterProvider as RouterProviderBase,
} from "@web-core/router";

import { routeTree } from "#/routeTree.gen";

const router = createRouter({ ...defaultRouterOptions, routeTree });

declare module "@web-core/router" {
  interface Register {
    router: typeof router;
  }
}

export function RouterProvider() {
  return <RouterProviderBase router={router} />;
}
