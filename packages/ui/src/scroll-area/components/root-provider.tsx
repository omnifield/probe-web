import {
  ScrollAreaRootProvider as ArkRootProvider,
  type ScrollAreaRootProviderProps as ArkRootProviderProps,
} from "@ark-ui/solid/scroll-area";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";

export type ScrollAreaRootProviderProps = ArkRootProviderProps;

// Второй способ завести root, рядом с `ScrollArea` (`./root.js`): вместо того чтобы дать
// машину завести самому себе, потребитель заводит её сам (`useScrollArea()`) и держит снаружи —
// нужно, когда машине требуется дотянуться извне (`scrollToEdge`/`scrollTo` — настоящее
// программное управление прокруткой, не через ref/scrollTop).
export function ScrollAreaRootProvider(props: ScrollAreaRootProviderProps) {
  traceLife("ui.scroll-area-root-provider");

  return <ArkRootProvider {...dropAddress(props)} />;
}
