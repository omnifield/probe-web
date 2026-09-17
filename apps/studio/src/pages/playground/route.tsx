import { createFileRoute } from "@tanstack/solid-router";
import { PlaygroundPage } from "./index";

export const Route = createFileRoute("/_workspace/playground")({
  component: PlaygroundPage,
});
