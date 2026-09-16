import { createMemo } from "solid-js";
import { Flow, FlowItem, useCarousel, type UseCarouselReturn } from "@web-core/ui";
import { ControlNavigation } from "../../control/navigation";
import { Axis } from "./axis";

type Cell = { name: string; content: string };
type Row = { name: string; cells: Cell[] };

const matrix: Row[] = [
  {
    name: "Строка A",
    cells: [
      { name: "A1", content: "Контент A1" },
      { name: "A2", content: "Контент A2" },
      { name: "A3", content: "Контент A3" },
    ],
  },
  {
    name: "Строка B",
    cells: [
      { name: "B1", content: "Контент B1" },
      { name: "B2", content: "Контент B2" },
    ],
  },
  {
    name: "Строка C",
    cells: [
      { name: "C1", content: "Контент C1" },
      { name: "C2", content: "Контент C2" },
      { name: "C3", content: "Контент C3" },
      { name: "C4", content: "Контент C4" },
    ],
  },
];

export function Matrix() {
  const rows = useCarousel({
    slideCount: matrix.length,
    orientation: "vertical",
  });
  const rowApis: UseCarouselReturn[] = [];

  const activeRow = createMemo(() => rowApis[rows().page]);
  const activeRowName = createMemo(() => matrix[rows().page].name);
  const activeCellName = createMemo(() => {
    const cellsApi = activeRow();
    return cellsApi
      ? matrix[rows().page].cells[cellsApi().page]?.name
      : undefined;
  });

  return (
    <Flow data-variant="column">
      <FlowItem>
        <ControlNavigation
          api={rows}
          orientation="vertical"
          label={<strong>{activeRowName()}</strong>}
        />

        <ControlNavigation
          api={() => activeRow()?.()}
          orientation="horizontal"
          label={<strong>{activeCellName()}</strong>}
        />
      </FlowItem>

      <FlowItem>
        <Axis api={rows} items={matrix} orientation="vertical">
          {(row, index) => {
            const cells = useCarousel({ slideCount: row.cells.length });
            rowApis[index()] = cells;

            return (
              <Axis api={cells} items={row.cells} orientation="horizontal">
                {(cell) => cell.content}
              </Axis>
            );
          }}
        </Axis>
      </FlowItem>
    </Flow>
  );
}
