export { Toc, type TocProps } from "./root.js";
export { TocContent, type TocContentProps } from "./content.js";
export { TocNav, type TocNavProps } from "./nav.js";
export { TocTitle, type TocTitleProps } from "./title.js";
export { TocList, type TocListProps } from "./list.js";
export { TocIndicator, type TocIndicatorProps } from "./indicator.js";
export { TocItem, type TocItemProps } from "./item.js";
export { TocLink, type TocLinkProps } from "./link.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Toc } from "./root.js";
import { TocContent } from "./content.js";
import { TocNav } from "./nav.js";
import { TocTitle } from "./title.js";
import { TocList } from "./list.js";
import { TocIndicator } from "./indicator.js";
import { TocItem } from "./item.js";
import { TocLink } from "./link.js";

export const kit = defineKitComponent(passport, {
  root: Toc,
  content: TocContent,
  nav: TocNav,
  title: TocTitle,
  list: TocList,
  indicator: TocIndicator,
  item: TocItem,
  link: TocLink,
});
