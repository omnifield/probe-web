import {
  Icon,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import { For } from "solid-js";
import {
  componentManagerStoreOf,
  useComponentName,
  VIEW_MODES,
  type ViewMode,
} from "../../../../model";

export function SwitchViewModeGlobal() {
  const store = componentManagerStoreOf(useComponentName());
  const viewMode = store.selectors.viewMode;

  return (
    <SegmentGroup
      orientation="horizontal"
      value={viewMode()}
      onValueChange={(details) => {
        if (details.value) {
          store.actions.setViewMode(details.value as ViewMode);
        }
      }}
    >
      <SegmentGroupIndicator />
      <For each={VIEW_MODES}>
        {(mode) => (
          <SegmentGroupItem value={mode.value}>
            <SegmentGroupItemControl />
            <SegmentGroupItemText>
              <Icon name={mode.icon} />
            </SegmentGroupItemText>
          </SegmentGroupItem>
        )}
      </For>
    </SegmentGroup>
  );
}
