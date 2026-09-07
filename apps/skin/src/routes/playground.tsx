import { createFileRoute } from "@tanstack/solid-router";

import { PlaygroundPage } from "../pages/playground";

export const Route = createFileRoute("/playground")({
  component: PlaygroundPage,
});
