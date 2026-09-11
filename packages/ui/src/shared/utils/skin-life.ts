import { useComponentSkin } from "@web-core/skin/solid";
import type { ComponentPassport } from "@web-core/skin/model";

import { traceLife } from "./trace.js";

/** Трейс + скин компонента кита одним вызовом. Разбор — README.md, раздел «Скин». */
export function useKitLife(passport: ComponentPassport, props: object): void {
  traceLife(`ui.${passport.component}`);
  useComponentSkin(passport, props);
}
