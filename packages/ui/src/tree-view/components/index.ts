export { createFileTreeCollection, createTreeCollection, type TreeCollection, type TreeNode } from "@ark-ui/solid/tree-view";

export { TreeRoot, type TreeRootProps } from "./root.js";
export { TreeItem, type TreeItemProps } from "./item/index.js";
export { TreeItemControl, type TreeItemControlProps } from "./item/control.js";
export { TreeControlIndicator, type TreeControlIndicatorProps } from "./item/indicator.js";
export { TreeItemContent, type TreeItemContentProps } from "./item/content.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { TreeItemContent } from "./item/content.js";
import { TreeItemControl } from "./item/control.js";
import { TreeItem } from "./item/index.js";
import { TreeControlIndicator } from "./item/indicator.js";
import { TreeRoot } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: TreeRoot,
  item: TreeItem,
  itemControl: TreeItemControl,
  controlIndicator: TreeControlIndicator,
  itemContent: TreeItemContent,
});
