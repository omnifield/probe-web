import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import { For } from "solid-js";
import {
  componentManagerStoreOf,
  LAYOUT_MODES,
  useComponentName,
  VIEW_MODES,
  type LayoutMode,
  type ViewMode,
} from "../../../model";

function Toggle<Value extends string>(props: {
  value: Value;
  items: readonly Value[];
  onChange: (value: Value) => void;
}) {
  return (
    <SegmentGroup
      orientation="horizontal"
      value={props.value}
      onValueChange={(details) => {
        if (details.value) {
          props.onChange(details.value as Value);
        }
      }}
    >
      <SegmentGroupIndicator />
      <For each={props.items}>
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

export function ToggleModes() {
  const store = componentManagerStoreOf(useComponentName());
  const layoutMode = store.use((state) => state.layoutMode);
  const viewMode = store.selectors.viewMode;

  return (
    <>
      <Toggle
        value={layoutMode()}
        items={LAYOUT_MODES}
        onChange={(value: LayoutMode) => store.actions.setLayoutMode(value)}
      />
      <Toggle
        value={viewMode()}
        items={VIEW_MODES}
        onChange={(value: ViewMode) => store.actions.setViewMode(value)}
      />
    </>
  );
}
