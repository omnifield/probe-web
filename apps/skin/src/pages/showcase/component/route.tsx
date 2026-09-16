import { createFileRoute, notFound } from "@tanstack/solid-router";
import { componentDescriptorOf, Loader } from "#/entities/component";
import { ComponentPage } from "./index";

export const Route = createFileRoute(
  "/_workspace/showcase/{-$component}/{-$view}",
)({
  loader: ({ params }) => {
    const { component } = params;
    if (component === undefined) throw notFound();

    return {
      component,
      descriptor: componentDescriptorOf(component),
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
      />
    );
  },
});
