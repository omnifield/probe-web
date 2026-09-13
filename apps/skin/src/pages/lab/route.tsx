import { createFileRoute } from "@tanstack/solid-router";

import { LabPage } from "./index";

export const Route = createFileRoute("/_workspace/lab/{-$component}")({
  component: LabPage,
});
