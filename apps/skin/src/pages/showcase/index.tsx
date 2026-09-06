import { useAtom } from "@web-core/store";
import { createEffect } from "solid-js";

import { componentDataAtom, setCurrentComponent } from "#/entities/component";
import { Preview } from "#/widgets/component";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const data = useAtom(componentDataAtom);

  return (
    <Preview
      component={props.component}
      assembly={props.assembly}
      data={data()}
    />
  );
}
