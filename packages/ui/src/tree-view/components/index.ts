export { createFileTreeCollection, createTreeCollection, type TreeCollection, type TreeNode } from "@ark-ui/solid/tree-view";

export { TreeRoot, type TreeRootProps } from "./root.js";
export { TreeItem, type TreeItemProps } from "./item/index.js";
export { TreeControl, type TreeControlProps } from "./item/control.js";
export { TreeControlIndicator, type TreeControlIndicatorProps } from "./item/indicator.js";
export { TreeContent, type TreeContentProps } from "./item/content.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { TreeContent } from "./item/content.js";
import { TreeControl } from "./item/control.js";
import { TreeItem } from "./item/index.js";
import { TreeControlIndicator } from "./item/indicator.js";
import { TreeRoot } from "./root.js";

export const kit = defineKitComponent(passport, {
  root: TreeRoot,
  item: TreeItem,
  control: TreeControl,
  controlIndicator: TreeControlIndicator,
  content: TreeContent,
});
