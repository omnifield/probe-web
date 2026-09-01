import { anatomy as treeViewAnatomy } from "@zag-js/tree-view/anatomy";

export const anatomy = treeViewAnatomy.extendWith("itemContent", "itemTrigger");

export const anatomyParts = anatomy.build();
