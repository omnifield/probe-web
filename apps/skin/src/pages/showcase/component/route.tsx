import { createFileRoute } from "@tanstack/solid-router";

import { ComponentPage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/{-$component}/")({
  component: ComponentPage,
});
