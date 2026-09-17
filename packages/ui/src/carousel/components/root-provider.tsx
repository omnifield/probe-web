import {
  CarouselRootProvider as ArkRootProvider,
  type CarouselRootProviderProps as ArkRootProviderProps,
} from "@ark-ui/solid/carousel";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type CarouselRootProviderProps = ArkRootProviderProps;

// Второй способ завести root, рядом с `Carousel` (`./root.js`): вместо того чтобы машина
// заводила себя сама, потребитель заводит её сам (`useCarousel()`) и держит снаружи — нужно, когда
// машине требуется пульт извне (`scrollNext`/`scrollPrev`/`scrollToIndex` — настоящее программное
// управление, не через клик по своей же кнопке внутри дерева).
export function CarouselRootProvider(props: CarouselRootProviderProps) {
  traceLife("ui.carousel-root-provider");

  return <ArkRootProvider {...dropAddress(props)} />;
}
