import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import { For } from "solid-js";

export type StandMode = "demo" | "style" | "assembly";
export const STAND_MODES: readonly StandMode[] = ["demo", "style", "assembly"];

export function StandControlView(props: {
  mode: StandMode;
  onModeChange: (mode: StandMode) => void;
}) {
  return (
    <SegmentGroup
      orientation="horizontal"
      value={props.mode}
      onValueChange={(details) => {
        if (details.value) props.onModeChange(details.value as StandMode);
      }}
    >
      <SegmentGroupIndicator />
      <For each={STAND_MODES}>
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
