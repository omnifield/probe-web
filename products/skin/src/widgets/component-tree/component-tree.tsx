import { useAtom } from "@omnifield/probe-web-store";
import { createEffect } from "solid-js";

import { componentTreeAtom } from "#/entities/component/model/store.js";

export function ComponentTree() {
  const items = useAtom(componentTreeAtom);

  createEffect(() => {
    console.log(items());
  });

  return null;
}
