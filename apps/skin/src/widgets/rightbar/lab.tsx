// Райтбар лаборатории (`/lab`) — сведения о компоненте и чат с агентом. Полей данных показа тут
// нет намеренно (решение user 2026-09-09): `/lab` — страница СОЗДАНИЯ (чат, гибкие настройки вида
// в два уровня — заведено отдельным заходом), выбор/правка данных — дело витрины (`./showcase.tsx`).
import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { Chat } from "#/entities/chat";
import { Info } from "#/widgets/component";

// Ширину задаёт сам `Chat` (`cardVar("card-md")` на своём корневом `Flow`) — тут не дублируем.
export function RightbarLab() {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Info />
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Chat />
      </FlowItem>
    </Flow>
  );
}
