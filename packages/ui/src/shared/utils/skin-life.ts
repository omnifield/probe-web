import { useComponentValidation, type ComponentValidation } from "@web-core/form/solid";
import { useComponentSkin } from "@web-core/skin/solid";
import type { ComponentPassport } from "@web-core/skin/model";
import type { Accessor } from "solid-js";

import { traceLife } from "./trace.js";

/** Трейс + скин + валидация компонента кита одним вызовом. Разбор — README.md, раздел «Скин». */
export function useKitLife(
  passport: ComponentPassport,
  props: object,
): Accessor<ComponentValidation | undefined> {
  traceLife(`ui.${passport.component}`);
  useComponentSkin(passport, props);
  return useComponentValidation(passport, props);
}
