import { createFileRoute } from "@tanstack/solid-router";

import { componentDescriptorOf, groupByTag, Loader, variantsOf } from "#/entities/component";
import { ComponentPage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/{-$component}/")({
  loader: async ({ params }) => {
    const { component } = params;
    const variants = component === undefined ? [] : await variantsOf(component);

    return {
      descriptor: component === undefined ? undefined : componentDescriptorOf(component),
      tags: groupByTag(variants),
    };
  },
  pendingComponent: Loader,
  component: () => {
    const data = Route.useLoaderData();
    return <ComponentPage descriptor={data().descriptor} tags={data().tags} />;
  },
});
