import { createFileRoute } from "@tanstack/solid-router";

import { LabPage } from "../pages/lab";

export const Route = createFileRoute("/_workspace/lab")({
  component: LabPage,
});
