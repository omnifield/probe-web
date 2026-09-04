import { useAtom } from "@web-core/store";
import { createEffect } from "solid-js";

import { componentInfoAtom, setCurrentComponent } from "#/entities/component/model/store.js";
import { ComponentPreview } from "#/widgets/component-preview/component-preview.jsx";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const info = useAtom(componentInfoAtom);
  createEffect(() => {
    const state = info();
    console.log(state.status === "done" ? state.data : state.status);
  });

  return <ComponentPreview component={props.component} assembly={props.assembly} />;
}
