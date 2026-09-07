// СЛОТ ПОКАЗА — место витрины, куда ставится показываемое. Сверху навигация по сборкам
// (Segment Group), ниже одна горизонтальная карусель по вариантам.
import type { DispatchedEvent } from "@web-core/assembly";
import { layoutSelf } from "@web-core/skin";
import type { PassportAssembly } from "@web-core/skin/editor";
import { Renderer } from "#/entities/component";
import { slotSizeOf } from "#/entities/component/utils/slot-size";
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
  Flow,
  Typography,
  type CarouselProps,
  Surface,
  FlowItem,
} from "@web-core/ui";
import { createEffect, createSignal, For } from "solid-js";
import { layoutGroup } from "@web-core/skin";
import { Control } from "./control";

export function Slot(props: {
  component: string;
  tag: string;
  assemblies: readonly PassportAssembly[];
  variants: readonly string[];
  data?: unknown;
  dispatch?: (event: DispatchedEvent) => void;
  defaultPage?: number;
  page?: CarouselProps["page"];
  onPageChange?: CarouselProps["onPageChange"];
  orientation?: CarouselProps["orientation"];
}) {
  createEffect(() => console.log(props.assemblies, props.variants));

  const [currentAssembly, setCurrentAssembly] = createSignal<string>();

  // Активна сама, без клика — всегда 0-й элемент: сменился компонент (значит и список сборок) —
  // назад на первую, а не оставленная по имени (у соседних компонентов сборки тоже зовут "base").
  createEffect(() => {
    void props.component; // трекаем смену компонента явно, не только смену списка сборок
    setCurrentAssembly(props.assemblies[0]?.name);
  });

  createEffect(() => console.log("currentAssembly", currentAssembly()));

  const [currentPage, setCurrentPage] = createSignal(props.defaultPage ?? 0);

  return (
    <Surface>
      <Flow data-variant="column-center">
        <Control
          tag={props.tag}
          assemblies={props.assemblies}
          value={currentAssembly()}
          onValueChange={setCurrentAssembly}
        />

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
          <CarouselItemGroup style={slotSizeOf(props.component)}>
            <For each={props.variants}>
              {(variant, index) => (
                <CarouselItem index={index()}>
                  <Renderer
                    component={props.component}
                    assembly={currentAssembly()}
                    variant={variant}
                    data={props.data}
                    dispatch={props.dispatch}
                  />
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
      </Flow>
    </Surface>
  );
}
