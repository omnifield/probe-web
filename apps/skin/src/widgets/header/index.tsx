// ШАПКА ВИТРИНЫ — переключатель экрана (showcase/lab/playground) и переключатель темы. Содержимое
// `WorkspaceHeader`, не сам слот: раскладку (флекс, отступы) держит страница (`pages/index.tsx`).
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  Surface,
  FlowItem,
  Flow,
} from "@web-core/ui";
import { layoutGroup } from "@web-core/skin";
import { useLocation, useNavigate } from "@web-core/router";
import { createMemo, For } from "solid-js";

import { ThemeSwitch } from "#/shared/ui/theme-switch";

const SCREENS = [
  { value: "showcase", label: "Showcase", to: "/showcase" },
  { value: "lab", label: "Lab", to: "/lab" },
  { value: "playground", label: "Playground", to: "/playground" },
] as const;

export function Header() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();

  const screen = createMemo(
    () =>
      SCREENS.find((item) => pathname().startsWith(item.to))?.value ??
      "showcase",
  );

  const onValueChange = (details: { value: string | null }) => {
    const target = SCREENS.find((screen) => screen.value === details.value);
    if (target) void navigate({ to: target.to });
  };

  return (
    <Flow style={layoutGroup({ justify: "space-between" })}>
      <FlowItem>
        <SegmentGroup
          value={screen()}
          onValueChange={onValueChange}
          orientation="horizontal"
        >
          <SegmentGroupIndicator />
          <For each={SCREENS}>
            {(item) => (
              <SegmentGroupItem value={item.value}>
                <SegmentGroupItemControl />
                <SegmentGroupItemText>{item.label}</SegmentGroupItemText>
              </SegmentGroupItem>
            )}
          </For>
        </SegmentGroup>
      </FlowItem>
      <FlowItem>
        <ThemeSwitch />
      </FlowItem>
    </Flow>
  );
}
