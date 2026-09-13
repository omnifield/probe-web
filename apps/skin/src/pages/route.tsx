// Pathless layout — хром витрины (Header/сайдбар/чат), общий для всех "живых" маршрутов юзера
// (`/`, `/lab`, `/playground`, `/showcase/...`). `_workspace` не входит в URL — только в
// файловое дерево `routes/`, поэтому все дочерние файлы переехали сюда с префиксом
// `_workspace.` без смены собственного пути. `/embed/...` — сосед по дереву, НЕ дочерний
// маршрут этого layout, поэтому его не наследует.
import { createFileRoute } from "@tanstack/solid-router";

import { WorkspaceLayout } from "../pages";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});
