import { createFileRoute } from "@tanstack/solid-router";

import { LabPage } from "../../pages/_workspace/lab/index.jsx";

export const Route = createFileRoute("/_workspace/lab")({
  component: LabPage,
});
