// см. README.md / FAQ.md

import { type Component, createEffect } from "solid-js";

import { note } from "../shared/trace.js";
import type { ErrorFallbackProps, FallbackProps } from "./types.js";

export const DefaultFallback: Component<FallbackProps> = (props) => {
  createEffect(() => {
    note(`адрес «${props.type}» не разрешён — узел «${props.nodeId}» не нарисован`);
  });
  return null;
};

export const DefaultErrorFallback: Component<ErrorFallbackProps> = (props) => {
  createEffect(() => {
    console.error(
      `[web-core-assembly] узел «${props.nodeId}» (${props.type}) упал при отрисовке:`,
      props.error,
    );
  });
  return null;
};
