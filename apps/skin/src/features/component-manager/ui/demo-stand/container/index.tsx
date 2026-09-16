import { Match, Switch } from "solid-js";
import { useMode } from "../../../model";
import { Matrix } from "../modes/matrix";
import { Grid } from "../modes/grid";

export function Container() {
  const { mode } = useMode();

  return (
    <Switch>
      <Match when={mode() === "matrix"}>
        <Matrix />
      </Match>
      <Match when={mode() === "grid"}>
        <Grid />
      </Match>
    </Switch>
  );
}
