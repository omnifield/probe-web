import { For } from "solid-js";
import { Flow, Grid as UiGrid, GridCell, Typography } from "@web-core/ui";
import type { Cell } from "../../lib/cell";
import type { Group } from "../../lib/group";
import { Wrapper } from "./wrapper";

export function Grid(props: { groups: readonly Group<Cell>[] }) {
  return (
    <For each={props.groups}>
      {(group) => (
        <Flow data-variant="column">
          {group.label !== "" && <Typography>{group.label}</Typography>}
          <UiGrid data-variant="gallery">
            <For each={group.items}>
              {(cell) => (
                <GridCell>
                  <Wrapper cell={cell} />
                </GridCell>
              )}
            </For>
          </UiGrid>
        </Flow>
      )}
    </For>
  );
}
