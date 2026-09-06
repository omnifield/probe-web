import { createResourceAtom } from "@web-core/store";
import { createSignal } from "solid-js";

import { componentInfo } from "./info";
import { listComponents } from "./list";
import { treeItems } from "./tree";

export const componentsAtom = createResourceAtom(() => listComponents());
export const componentTreeAtom = createResourceAtom(() => treeItems());

export const [currentComponent, setCurrentComponent] = createSignal<string | undefined>();

export const componentInfoAtom = createResourceAtom(currentComponent, (component) =>
  component === undefined ? Promise.resolve(undefined) : componentInfo(component),
);
