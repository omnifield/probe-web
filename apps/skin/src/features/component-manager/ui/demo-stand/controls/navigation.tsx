import type { JSX } from "solid-js";
import type { UseCarouselReturn } from "@web-core/ui";

type CarouselApi = ReturnType<UseCarouselReturn>;

const ICONS = {
  horizontal: { prev: "◀", next: "▶" },
  vertical: { prev: "▲", next: "▼" },
} as const;

export function ControlNavigation(props: {
  api: () => CarouselApi | undefined;
  orientation: "horizontal" | "vertical";
  label?: JSX.Element;
}) {
  const icons = () => ICONS[props.orientation];

  return (
    <>
      <button
        onClick={() => props.api()?.scrollPrev()}
        disabled={!props.api()?.canScrollPrev}
      >
        {icons().prev}
      </button>
      <button
        onClick={() => props.api()?.scrollNext()}
        disabled={!props.api()?.canScrollNext}
      >
        {icons().next}
      </button>
      {props.label}
    </>
  );
}
