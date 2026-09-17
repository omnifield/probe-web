import { For } from "solid-js";
import type { JSX } from "solid-js";
import {
  CarouselItem,
  CarouselItemGroup,
  CarouselRootProvider,
  type UseCarouselReturn,
} from "@web-core/ui";
import { Indicator } from "../../indicators";

export function Axis<T>(props: {
  api: UseCarouselReturn;
  items: readonly T[];
  orientation: "horizontal" | "vertical";
  children: (item: T, index: () => number) => JSX.Element;
}) {
  return (
    <CarouselRootProvider value={props.api}>
      <CarouselItemGroup>
        <For each={props.items}>
          {(item, index) => (
            <CarouselItem index={index()}>
              {props.children(item, index)}
            </CarouselItem>
          )}
        </For>
      </CarouselItemGroup>
      <Indicator count={props.items.length} orientation={props.orientation} />
    </CarouselRootProvider>
  );
}
