import { For } from "solid-js";
import { Grid as UiGrid, GridCell } from "@web-core/ui";

const MOCK_CELLS = ["Ячейка 1", "Ячейка 2", "Ячейка 3", "Ячейка 4"];

export function Grid() {
  return (
    <UiGrid>
      <For each={MOCK_CELLS}>{(cell) => <GridCell>{cell}</GridCell>}</For>
    </UiGrid>
  );
}
