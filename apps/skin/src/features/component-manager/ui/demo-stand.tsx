import type { TagGroup } from "@web-core/skin/tags";
import { componentStore, Preview } from "#/entities/component";
import { Surface } from "@web-core/ui";

export function DemoStand(props: { item: TagGroup }) {
  const component = componentStore.use((state) => state.component);

  return (
    <Preview component={component() ?? ""} variants={props.item.variants} />
  );
}
