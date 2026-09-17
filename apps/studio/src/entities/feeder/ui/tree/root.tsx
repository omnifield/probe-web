import { createEffect, createMemo, createSignal } from "solid-js";
import { type FieldDescriptor, fieldsOf } from "@web-core/generators/fields";
import { componentStore } from "#/entities/component";
import type { FieldBinding } from "../../lib/binding";
import { Node } from "./node";

export function FeedData() {
  const kit = componentStore.use((state) => state.kit);
  const [feedData, setFeedData] = createSignal<unknown>();

  createEffect((previousKit) => {
    const currentKit = kit();
    if (currentKit !== previousKit) setFeedData(undefined);
    return currentKit;
  });

  const fields = createMemo<readonly FieldDescriptor[]>(() => {
    const schema = kit()?.io?.schema;

    return schema ? fieldsOf(schema) : [];
  });

  const binding: FieldBinding = {
    value: () => feedData() ?? {},
    onChange: setFeedData,
  };

  return <Node fields={fields()} binding={binding} />;
}
