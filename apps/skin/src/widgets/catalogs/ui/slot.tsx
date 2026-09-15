import { layoutSelf } from "@web-core/skin";
import {
  Carousel,
  CarouselControl,
  CarouselIndicator,
  CarouselIndicatorGroup,
  CarouselItem,
  CarouselItemGroup,
  CarouselNextTrigger,
  CarouselPrevTrigger,
  CarouselProgressText,
  Typography,
  type CarouselProps,
} from "@web-core/ui";
import { createSignal, For, type JSX } from "solid-js";

import type { SlotSize } from "../lib/size";

export function Slot<Item>(props: {
  items: readonly Item[];
  label: (item: Item) => string;
  children: (item: Item, index: number) => JSX.Element;
  size?: SlotSize;
  defaultPage?: number;
  page?: CarouselProps["page"];
  onPageChange?: CarouselProps["onPageChange"];
  orientation?: CarouselProps["orientation"];
}) {
  const [currentPage, setCurrentPage] = createSignal(props.defaultPage ?? 0);

  return (
    <Carousel
      style={layoutSelf({ align: "stretch" })}
      data-variant="plain"
      slideCount={props.items.length}
      defaultPage={props.defaultPage}
      page={props.page}
      onPageChange={(details) => {
        setCurrentPage(details.page);
        props.onPageChange?.(details);
      }}
    >
      <CarouselControl>
        <CarouselPrevTrigger>‹</CarouselPrevTrigger>
        <CarouselProgressText>
          <Typography>{props.label(props.items[currentPage()])}</Typography>
        </CarouselProgressText>
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup style={props.size}>
        <For each={props.items}>
          {(item, index) => <CarouselItem index={index()}>{props.children(item, index())}</CarouselItem>}
        </For>
      </CarouselItemGroup>
      <CarouselIndicatorGroup>
        <For each={props.items}>{(_item, index) => <CarouselIndicator index={index()} />}</For>
      </CarouselIndicatorGroup>
    </Carousel>
  );
}
