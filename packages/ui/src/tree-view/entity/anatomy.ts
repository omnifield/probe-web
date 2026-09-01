import { anatomy as treeViewAnatomy } from "@zag-js/tree-view/anatomy";

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
  .extendWith("itemControl", "controlIndicator", "itemContent");

export const anatomyParts = anatomy.build();
