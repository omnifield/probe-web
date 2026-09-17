import { Match, Switch } from "solid-js";
import type { PassportAssembly } from "@web-core/skin/editor";
import type { VariantSummary } from "@web-core/skin/presets";
import { componentManagerStoreOf, useComponentName } from "../../../model";
import type { Cell } from "../../../lib/cell";
import { groupByTags } from "../../../lib/group";
import { Grid } from "./grid";

type PrimaryItem = VariantSummary | PassportAssembly;

export function Distributor() {
  const name = useComponentName();
  const store = componentManagerStoreOf(name);
  const layoutMode = store.use((state) => state.layoutMode);
  const axis = store.use((state) => state.axis);
  const variants = store.use((state) => state.variants ?? []);
  const assemblies = store.use((state) => state.editorInfo?.assemblies ?? []);

  const primary = (): readonly PrimaryItem[] =>
    axis() === "variant" ? variants() : assemblies();

  const indexed = () => primary().map((item, index) => ({ item, index }));

  const groups = () =>
    groupByTags(indexed(), (entry) =>
      "tags" in entry.item ? entry.item.tags : undefined,
    ).map((group) => ({
      label: group.label,
      items: group.items.map(
        (entry): Cell => ({ index: entry.index, id: String(entry.index) }),
      ),
    }));

  return (
    <Switch>
      <Match when={layoutMode() === "grid"}>
        <Grid groups={groups()} />
      </Match>
      <Match when={layoutMode() === "matrix"}>
        <div>Matrix</div>
      </Match>
    </Switch>
  );
}
