import { Match, Switch } from "solid-js";
import { componentManagerStoreOf, useComponentName } from "../../../model";
import { Matrix } from "../layouts/matrix";
import { Grid } from "../layouts/grid";

export function Container() {
  const store = componentManagerStoreOf(useComponentName());
  const layoutMode = store.use((state) => state.layoutMode);

  return (
    <Switch>
      <Match when={layoutMode() === "matrix"}>
        <div>wdad</div>
        {/* <Matrix /> */}
      </Match>
      <Match when={layoutMode() === "grid"}>
        <Grid />
      </Match>
    </Switch>
  );
}
