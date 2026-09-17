import { createFileRoute, notFound } from "@tanstack/solid-router";
import { Loader } from "#/entities/component";
import { ComponentPage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/{-$component}/{-$view}")({
  loader: ({ params }) => {
    if (params.component === undefined) throw notFound();
  },
  pendingComponent: Loader,
  notFoundComponent: () => null,
  component: () => <ComponentPage />,
});
