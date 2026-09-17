import { For } from "solid-js";
import { CarouselIndicator, CarouselIndicatorGroup } from "@web-core/ui";

const STYLE = {
  horizontal: { display: "flex" },
  vertical: { display: "flex", "flex-direction": "column" },
} as const;

export function Indicator(props: {
  count: number;
  orientation: "horizontal" | "vertical";
}) {
  return (
    <CarouselIndicatorGroup style={STYLE[props.orientation]}>
      <For each={Array.from({ length: props.count })}>
        {(_item, index) => <CarouselIndicator index={index()} />}
      </For>
    </CarouselIndicatorGroup>
  );
}
