// MAP of tabs: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator } from "./index.jsx";

/** The tabs' passport together with whatever draws each of its five parts. */
export const kit = defineKitComponent(passport, {
  root: Tabs,
  list: TabsList,
  trigger: TabsTrigger,
  content: TabsContent,
  indicator: TabsIndicator,
});
