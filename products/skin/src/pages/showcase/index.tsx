import { createEffect } from "solid-js";

import { componentInfo } from "#/entities/component/model/info.js";
import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => {
    const component = props.component;
    const assembly = props.assembly;

    void componentInfo(component).then((info) => {
      console.log({ assembly, ...info });
    });
  });

  return <Renderer component={props.component} assembly={props.assembly} />;
}
