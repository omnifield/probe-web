import { createFileRoute } from "@tanstack/solid-router";

import { PlaygroundPage } from "../pages/playground";

export const Route = createFileRoute("/_workspace/playground")({
  component: PlaygroundPage,
});
