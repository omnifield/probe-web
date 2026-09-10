// Райтбар лаборатории (`/lab`) — редактор эндпоинтов OpenAPI (Lab — адаптеры, ROADMAP.yaml).
import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { OpenApi } from "#/entities/adapter";

export function RightbarLab() {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <OpenApi />
      </FlowItem>
    </Flow>
  );
}
