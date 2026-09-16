import { createFileRoute, notFound } from "@tanstack/solid-router";

import {
  componentDescriptorOf,
  groupByTag,
  Loader,
  variantsOf,
} from "#/entities/component";
import { ComponentPage } from "./index";

export const Route = createFileRoute(
  "/_workspace/showcase/{-$component}/{-$view}",
)({
  loader: async ({ params }) => {
    const { component } = params;
    if (component === undefined) throw notFound();

    const variants = await variantsOf(component);
    return {
      component,
      descriptor: componentDescriptorOf(component),
      tags: groupByTag(variants),
    };
  },
  pendingComponent: Loader,
  notFoundComponent: () => null,
  component: () => {
    const data = Route.useLoaderData();

    return (
      <ComponentPage
        component={data().component}
        descriptor={data().descriptor}
        tags={data().tags}
      />
    );
  },
});
