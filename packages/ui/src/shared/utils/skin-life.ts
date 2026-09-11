import { useComponentSkin } from "@web-core/skin/solid";
import type { ComponentPassport } from "@web-core/skin/model";

import { traceLife } from "./trace.js";

/**
 * Замена `traceLife("ui.<component>")` в каждом root.tsx кита: метка трейса выводится из
 * `passport.component` (та же строка, что задаёт анатомия через `.rename(...)`), а не вбивается
 * руками — расхождение между ними больше не может тихо накопиться.
 */
export function useKitLife(passport: ComponentPassport, props: object): void {
  traceLife(`ui.${passport.component}`);
  useComponentSkin(passport, props);
}
