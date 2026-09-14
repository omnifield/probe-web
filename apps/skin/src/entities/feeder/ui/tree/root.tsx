import { createMemo } from "solid-js";
import { fieldsOf, type FieldDescriptor } from "@web-core/generators/fields";

import { componentStore } from "#/entities/component";
import type { FieldBinding } from "../../lib/binding";
import { Node } from "./node";

export function FeedData() {
  const kit = componentStore.use((state) => state.kit);
  const feedData = componentStore.use((state) => state.feedData);
  const fields = createMemo<readonly FieldDescriptor[]>(() => {
    const schema = kit()?.io?.schema;

    return schema ? fieldsOf(schema) : [];
  });

  const binding: FieldBinding = {
    value: () => feedData() ?? {},
    onChange: (value) => componentStore.actions.setFeedData(value),
  };

  return <Node fields={fields()} binding={binding} />;
}
