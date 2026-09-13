// Pathless layout — хром витрины (Header/сайдбар/чат), общий для всех "живых" маршрутов юзера
// (`/`, `/lab`, `/playground`, `/showcase/...`). Дерево маршрутов задано явно в
// `shared/configs/routes.config.ts` (`layout("workspace", ...)`), не именами файлов — `_workspace`
// нигде не встречается. `/embed/...` — сосед по дереву на верхнем уровне конфига, НЕ дочерний
// маршрут этого layout, поэтому его не наследует.
import { createFileRoute } from "@tanstack/solid-router";
import { useLocation, useNavigate, useParams } from "@web-core/router";

import { WorkspaceLayout } from "./index";

export const Route = createFileRoute("/_workspace")({
  component: () => {
    const location = useLocation();
    const params = useParams({ strict: false });
    const navigate = useNavigate();
    return (
      <WorkspaceLayout
        location={location}
        params={params}
        navigate={navigate}
      />
    );
  },
});
