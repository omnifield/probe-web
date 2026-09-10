// Райтбар витрины (`/showcase/...`) — сведения о компоненте и выбор/точечная правка его данных
// показа. Чата тут нет намеренно (решение user 2026-09-09): витрина — выставочный интерактив по
// готовым сборкам/вариантам, создание (чат с агентом) живёт на `/lab` (`./lab.tsx`).
import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { Info, Input } from "#/widgets/component";

export function RightbarShowcase() {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Info />
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Input />
      </FlowItem>
    </Flow>
  );
}
