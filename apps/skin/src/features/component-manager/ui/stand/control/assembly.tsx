import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import { createSignal, For } from "solid-js";

const MOCK_ASSEMBLIES = ["base", "compact", "wide"];

export function StandControlAssembly() {
  const [assembly, setAssembly] = createSignal(MOCK_ASSEMBLIES[0]);

  return (
    <SegmentGroup
      orientation="horizontal"
      value={assembly()}
      onValueChange={(details) => {
        if (details.value) setAssembly(details.value);
      }}
    >
      <SegmentGroupIndicator />
      <For each={MOCK_ASSEMBLIES}>
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
