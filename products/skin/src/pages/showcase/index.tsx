import { createEffect } from "solid-js";

import { useComponentInfo } from "#/entities/component/model/store.js";
import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  const info = useComponentInfo(() => props.component);

  createEffect(() => {
    console.log({ assembly: props.assembly, ...info() });
  });

  return <Renderer component={props.component} assembly={props.assembly} />;
}
