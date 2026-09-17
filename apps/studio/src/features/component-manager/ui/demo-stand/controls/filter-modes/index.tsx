import { For } from "solid-js";
import {
  Icon,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import {
  componentManagerStoreOf,
  FILTER_MODES,
  useComponentName,
  type FilterMode,
} from "../../../../model";

export function SwitchFilterMode() {
  const store = componentManagerStoreOf(useComponentName());
  const filterMode = store.use((state) => state.filterMode);

  return (
    <SegmentGroup
      orientation="horizontal"
      value={filterMode()}
      onValueChange={(details) => {
        if (details.value) {
          store.actions.setFilterMode(details.value as FilterMode);
        }
      }}
    >
      <SegmentGroupIndicator />
      <For each={FILTER_MODES}>
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
