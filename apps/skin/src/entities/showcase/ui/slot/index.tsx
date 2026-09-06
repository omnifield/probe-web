// СЛОТ ПОКАЗА — место витрины, куда ставится показываемое.
import type { PassportAssembly } from "@web-core/skin/editor";
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
  type CarouselProps,
} from "@web-core/ui";
import { createEffect, For } from "solid-js";

export function Slot(props: {
  assemblies: readonly PassportAssembly[];
  variants: readonly string[];
  defaultPage?: number;
  page?: CarouselProps["page"];
  onPageChange?: CarouselProps["onPageChange"];
  orientation?: CarouselProps["orientation"];
}) {
  createEffect(() => console.log(props.assemblies, props.variants));

  return (
    <Carousel
      slideCount={props.variants.length}
      defaultPage={props.defaultPage}
      page={props.page}
      onPageChange={props.onPageChange}
      data-variant="plain"
    >
      <CarouselControl>
        <CarouselPrevTrigger>‹</CarouselPrevTrigger>
        <CarouselProgressText>
          <For each={props.variants}>
            {(variant, index) => (
              <CarouselItem index={index()}>{variant}</CarouselItem>
            )}
          </For>
        </CarouselProgressText>
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup>
        <Carousel
          orientation={"vertical"}
          slideCount={props.assemblies.length}
          defaultPage={props.defaultPage}
          page={props.page}
          onPageChange={props.onPageChange}
          data-variant="plain"
        >
          <CarouselControl>
            <CarouselPrevTrigger>‹</CarouselPrevTrigger>
            <CarouselProgressText>
              <For each={props.assemblies}>
                {(assembly, index) => (
                  <CarouselItem index={index()}>{assembly.name}</CarouselItem>
                )}
              </For>
            </CarouselProgressText>
            <CarouselNextTrigger>›</CarouselNextTrigger>
          </CarouselControl>
          <CarouselItemGroup>
            <For each={props.assemblies}>
              {(assembly, index) => (
                <CarouselItem index={index()}>{assembly.name}</CarouselItem>
              )}
            </For>
          </CarouselItemGroup>
          <CarouselIndicatorGroup>
            <For each={props.assemblies}>
              {(_assembly, index) => <CarouselIndicator index={index()} />}
            </For>
          </CarouselIndicatorGroup>
        </Carousel>
      </CarouselItemGroup>
      <CarouselIndicatorGroup>
        <For each={props.assemblies}>
          {(_assembly, index) => <CarouselIndicator index={index()} />}
        </For>
      </CarouselIndicatorGroup>
    </Carousel>
  );
}
