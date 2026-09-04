import { createFileRoute } from "@tanstack/solid-router";

import { LabPage } from "../pages/lab/index.jsx";

export const Route = createFileRoute("/lab")({
  component: LabPage,
});
