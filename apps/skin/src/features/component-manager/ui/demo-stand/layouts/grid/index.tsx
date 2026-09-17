import { createSignal, For } from "solid-js";
import {
  Grid as UiGrid,
  GridCell,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  Surface,
} from "@web-core/ui";
import { componentManagerStoreOf, useComponentName } from "../../../../model";

export function Grid() {
  const name = useComponentName();
  const store = componentManagerStoreOf(name);
  const assemblies = store.use((state) => state.editorInfo?.assemblies ?? []);
  const variants = store.use((state) => state.variants ?? []);
  const [selected, setSelected] = createSignal(assemblies()[0]?.name);

  return (
    <>
      <SegmentGroup
        orientation="horizontal"
        value={selected()}
        onValueChange={(details) => {
          console.log(details.value);
          if (details.value) {
            setSelected(details.value);
          }
        }}
      >
        <SegmentGroupIndicator />
        <For each={assemblies()}>
          {(assembly) => (
            <SegmentGroupItem value={assembly.name}>
              <SegmentGroupItemControl />
              <SegmentGroupItemText>{assembly.name}</SegmentGroupItemText>
            </SegmentGroupItem>
          )}
        </For>
      </SegmentGroup>

      <UiGrid data-variant="gallery">
        <For each={variants()}>
          {(variant) => (
            <GridCell>
              <Surface>{variant.name}</Surface>
            </GridCell>
          )}
        </For>
      </UiGrid>
    </>
  );
}
