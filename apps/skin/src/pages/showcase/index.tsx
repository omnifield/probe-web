import { createEffect } from "solid-js";

import { componentStore } from "#/entities/component";

export function ShowcasePage() {
  const component = componentStore.use((state) => state.component);

  createEffect(() => {
    console.log("active component", component());
  });

  return <div>wdf</div>;
}
