// СЛОТ ПОКАЗА — место витрины, куда ставится показываемое. Сам не знает, ЧТО именно листает —
// просто карусель из чужих слайдов (обычно сборки одного компонента, но слоту это не название).
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
} from "@web-core/ui";
import { For, type JSX } from "solid-js";

export function Slot(props: { slides: readonly JSX.Element[]; defaultPage?: number }) {
  return (
    <Carousel slideCount={props.slides.length} defaultPage={props.defaultPage}>
      <CarouselControl>
        <CarouselPrevTrigger>‹</CarouselPrevTrigger>
        <CarouselProgressText />
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup>
        <For each={props.slides}>{(slide, index) => <CarouselItem index={index()}>{slide}</CarouselItem>}</For>
      </CarouselItemGroup>
      <CarouselIndicatorGroup>
        <For each={props.slides}>{(_slide, index) => <CarouselIndicator index={index()} />}</For>
      </CarouselIndicatorGroup>
    </Carousel>
  );
}
