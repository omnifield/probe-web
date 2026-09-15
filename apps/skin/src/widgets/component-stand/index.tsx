import type { TagGroup } from "@web-core/skin/tags";
import { componentStore, Preview } from "#/entities/component";
import { Surface } from "@web-core/ui";

export function ComponentStand(props: { item: TagGroup }) {
  const component = componentStore.use((state) => state.variants.component);
  const feedData = componentStore.use((state) => state.feedData);

  return (
    <Surface>
      <Preview
        component={component() ?? ""}
        variants={props.item.variants}
        data={feedData()}
      />
    </Surface>
  );
}
