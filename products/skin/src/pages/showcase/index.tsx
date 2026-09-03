import { useLocation } from "@omnifield/probe-web-router";
import { createEffect } from "solid-js";

import { editorInfoOf, passportOf } from "#/entities/component/model/providers.js";
import { Renderer } from "#/entities/component/ui/renderer/renderer.jsx";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  const location = useLocation();

  createEffect(() => {
    console.log({
      location: location(),
      component: props.component,
      assembly: props.assembly,
      passport: passportOf(props.component),
      editorInfo: editorInfoOf(props.component),
    });
  });

  return <Renderer component={props.component} assembly={props.assembly} />;
}
