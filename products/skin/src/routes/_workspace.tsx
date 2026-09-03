// Pathless-лайаут воркспейса — путь "/" не занимает, оборачивает детей (`showcase`, `lab`)
// общим каркасом `WorkspaceLayout` (`PWEB-173`, итерация 1 — проверка маршрутизации на моках).
import { createFileRoute } from "@tanstack/solid-router";

import { WorkspaceLayout } from "../pages/index.jsx";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});
