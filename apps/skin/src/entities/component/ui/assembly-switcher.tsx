import type { PassportAssembly } from "@web-core/skin/editor";
import {
  Flow,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  Typography,
} from "@web-core/ui";
import { For } from "solid-js";
import { layoutGroup, layoutSelf } from "@web-core/skin";
export function Control(props: {
  tag: string;
  assemblies: readonly PassportAssembly[];
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <Flow
      style={{
        ...layoutGroup({ justify: "space-between" }),
        ...layoutSelf({ align: "stretch" }),
      }}
    >
      <Typography id={props.tag}>{props.tag}</Typography>
      <SegmentGroup
        orientation="horizontal"
        value={props.value ?? null}
        onValueChange={(details) => {
          if (details.value) props.onValueChange?.(details.value);
        }}
      >
        <SegmentGroupIndicator />
        <For each={props.assemblies}>
          {(assembly) => (
            <SegmentGroupItem value={assembly.name}>
              <SegmentGroupItemControl />
              <SegmentGroupItemText>{assembly.name}</SegmentGroupItemText>
            </SegmentGroupItem>
          )}
        </For>
      </SegmentGroup>
    </Flow>
  );
}
