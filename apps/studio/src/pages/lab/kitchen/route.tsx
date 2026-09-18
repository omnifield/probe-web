import { createFileRoute } from "@tanstack/solid-router";
import { KitchenPage } from "./index";

export const Route = createFileRoute(
  "/_workspace/lab/{-$component}/{-$feature}",
)({
  component: KitchenPage,
});
