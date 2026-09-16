import {
  CarouselNextTrigger,
  CarouselPrevTrigger,
  CarouselProgressText,
  Typography,
} from "@web-core/ui";

export function StandControlVariant(props: { label: string }) {
  return (
    <>
      <CarouselPrevTrigger>‹</CarouselPrevTrigger>
      <CarouselProgressText>
        <Typography>{props.label}</Typography>
      </CarouselProgressText>
      <CarouselNextTrigger>›</CarouselNextTrigger>
    </>
  );
}
