import { Match, Switch } from "solid-js";
import type { PassportAssembly } from "@web-core/skin/editor";
import type { VariantSummary } from "@web-core/skin/presets";
import { componentManagerStoreOf, useComponentName } from "../../../model";
import type { Cell } from "../../../lib/cell";
import { groupByTags, noGroup } from "../../../lib/group";
import { Grid } from "./grid";
import { Matrix } from "./matrix";

type PrimaryItem = VariantSummary | PassportAssembly;

export function Distributor() {
  const name = useComponentName();
  const store = componentManagerStoreOf(name);
  const layoutMode = store.use((state) => state.layoutMode);
  const axis = store.use((state) => state.axisMode);
  const filter = store.use((state) => state.filterMode);
  const variants = store.use((state) => state.variants ?? []);
  const assemblies = store.use((state) => state.editorInfo?.assemblies ?? []);

  const primary = (): readonly PrimaryItem[] =>
    axis() === "variant" ? variants() : assemblies();
  const secondary = (): readonly PrimaryItem[] =>
    axis() === "variant" ? assemblies() : variants();

  const indexed = () => primary().map((item, index) => ({ item, index }));

  const entryGroups = () =>
    filter() === "tags"
      ? groupByTags(indexed(), (entry) =>
          "tags" in entry.item ? entry.item.tags : undefined,
        )
      : noGroup(indexed());

  const groups = () =>
    entryGroups().map((group) => ({
      label: group.label,
      items: group.items.map(
        (entry): Cell => ({
          primary: entry.index,
          id: String(entry.index),
          group: group.label,
        }),
      ),
    }));

  return (
    <Switch>
      <Match when={layoutMode() === "grid"}>
        <Grid groups={groups()} secondaryItems={secondary()} />
      </Match>
      <Match when={layoutMode() === "matrix"}>
        <Matrix groups={groups()} secondaryItems={secondary()} />
      </Match>
    </Switch>
  );
}
