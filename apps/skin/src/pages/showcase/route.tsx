import { createFileRoute } from "@tanstack/solid-router";

import { ShowcasePage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/{-$component}")({
  component: ShowcasePage,
});
