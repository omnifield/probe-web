import { anatomy as treeViewAnatomy } from "@zag-js/tree-view/anatomy";

import { parts } from "../../shared/data/anatomy.js";

export const anatomy = treeViewAnatomy
  .omit(
    "label",
    "tree",
    "itemText",
    "itemIndicator",
    "branch",
    "branchControl",
    "branchText",
    "branchIndicator",
    "branchTrigger",
    "branchContent",
    "branchIndentGuide",
    "nodeCheckbox",
    "nodeRenameInput",
  )
  .extendWith(...parts.controlSet, ...parts.content);

export const anatomyParts = anatomy.build();
