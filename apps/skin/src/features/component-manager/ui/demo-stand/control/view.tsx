import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import { createMemo, For } from "solid-js";
import { useParams } from "@web-core/router";
import {
  componentManagerStoreOf,
  VIEW_MODES,
  type ViewMode,
} from "../../../model";

export function StandControlView() {
  const component = useParams({
    strict: false,
    select: (params) => params.component,
  });
  const store = () => componentManagerStoreOf(component() ?? "");
  const viewMode = createMemo(() => store().use((state) => state.viewMode)());

  return (
    <SegmentGroup
      orientation="horizontal"
      value={viewMode()}
      onValueChange={(details) => {
        if (details.value) {
          store().actions.setViewMode(details.value as ViewMode);
        }
      }}
    >
      <SegmentGroupIndicator />
      <For each={VIEW_MODES}>
        {(item) => (
          <SegmentGroupItem value={item}>
            <SegmentGroupItemControl />
            <SegmentGroupItemText>{item}</SegmentGroupItemText>
          </SegmentGroupItem>
        )}
      </For>
    </SegmentGroup>
  );
}
