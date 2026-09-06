import { useAtom } from "@web-core/store";
import { createEffect } from "solid-js";

import { componentInfoAtom, setCurrentComponent } from "#/entities/component";
import { Preview } from "#/widgets/component";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const info = useAtom(componentInfoAtom);
  createEffect(() => {
    const state = info();
    console.log(state.status === "done" ? state.data : state.status);
  });

  return <Preview component={props.component} assembly={props.assembly} />;
}
