import { createAtom } from "@omnifield/probe-web-store";

import { listComponents } from "./list.js";
import { treeItems } from "./tree.js";

export const componentsAtom = createAtom(() => listComponents());
export const componentTreeAtom = createAtom(() => treeItems());
