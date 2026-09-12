import {
  ToastRoot as ArkRoot,
  ToastTitle as ArkTitle,
  ToastDescription as ArkDescription,
  ToastCloseTrigger as ArkCloseTrigger,
  Toaster as ArkToaster,
} from "@ark-ui/solid/toast";
import { Portal } from "solid-js/web";

import { getToaster } from "../control.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type ToastProps = Record<string, never>;

export function Toast(props: ToastProps) {
  useKitLife(passport, props);

  return (
    <Portal>
      <ArkToaster toaster={getToaster()} {...anatomyParts.group.attrs}>
        {(item) => (
          <ArkRoot {...anatomyParts.root.attrs}>
            <ArkTitle {...anatomyParts.title.attrs}>{item().title}</ArkTitle>
            <ArkDescription {...anatomyParts.description.attrs}>{item().description}</ArkDescription>
            <ArkCloseTrigger {...anatomyParts.closeTrigger.attrs}>✕</ArkCloseTrigger>
          </ArkRoot>
        )}
      </ArkToaster>
    </Portal>
  );
}
