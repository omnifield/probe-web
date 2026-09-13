import type { TagGroup } from "@web-core/skin/tags";

import { Control, Preview } from "#/entities/component";
import { Surface } from "@web-core/ui";

export function DemoStand(props: { component: string; group: TagGroup }) {
  return (
    <Surface>
      <Control tag={props.group.tag} assemblies={[]} />
      <Preview component={props.component} variants={props.group.variants} />
    </Surface>
  );
}
