import type { DispatchedEvent } from "@web-core/assembly";
import { layoutSelf } from "@web-core/skin";
import { Renderer } from "#/shared/ui/renderer";
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
import { createSignal, For, Show } from "solid-js";
import { Loader } from "../../loader";
import { getSize } from "../utils";

export function Preview(props: {
  component: string;
  currentAssembly?: string;
  variants: readonly string[];
  data?: unknown;
  loading?: boolean;
  dispatch?: (event: DispatchedEvent) => void;
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
      slideCount={props.variants.length}
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
          <Typography>{props.variants[currentPage()]}</Typography>
        </CarouselProgressText>
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup style={getSize(props.component)}>
        <For each={props.variants}>
          {(variant, index) => (
            <CarouselItem index={index()}>
              <Show when={props.loading !== true} fallback={<Loader />}>
                <Renderer
                  component={props.component}
                  assembly={props.currentAssembly}
                  variant={variant}
                  data={props.data}
                  dispatch={props.dispatch}
                />
              </Show>
            </CarouselItem>
          )}
        </For>
      </CarouselItemGroup>
      <CarouselIndicatorGroup>
        <For each={props.variants}>
          {(_variant, index) => <CarouselIndicator index={index()} />}
        </For>
      </CarouselIndicatorGroup>
    </Carousel>
  );
}
