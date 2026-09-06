import { createFileRoute } from "@tanstack/solid-router";

import { LabPage } from "../pages/lab";

export const Route = createFileRoute("/lab")({
  component: LabPage,
});
