export { Tabs, type TabsProps } from "./root.js";
export { TabsList, type TabsListProps } from "./list.js";
export { TabsTrigger, type TabsTriggerProps } from "./trigger.js";
export { TabsContent, type TabsContentProps } from "./content.js";
export { TabsIndicator, type TabsIndicatorProps } from "./indicator.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Tabs } from "./root.js";
import { TabsList } from "./list.js";
import { TabsTrigger } from "./trigger.js";
import { TabsContent } from "./content.js";
import { TabsIndicator } from "./indicator.js";

export const kit = defineKitComponent(passport, {
  root: Tabs,
  list: TabsList,
  trigger: TabsTrigger,
  content: TabsContent,
  indicator: TabsIndicator,
});
