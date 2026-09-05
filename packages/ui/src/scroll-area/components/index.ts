export { ScrollArea, type ScrollAreaProps } from "./root.js";
export { ScrollAreaViewport, type ScrollAreaViewportProps } from "./viewport.js";
export { ScrollAreaContent, type ScrollAreaContentProps } from "./content.js";
export { ScrollAreaScrollbar, type ScrollAreaScrollbarProps } from "./scrollbar.js";
export { ScrollAreaThumb, type ScrollAreaThumbProps } from "./thumb.js";
export { ScrollAreaCorner, type ScrollAreaCornerProps } from "./corner.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { ScrollArea } from "./root.js";
import { ScrollAreaViewport } from "./viewport.js";
import { ScrollAreaContent } from "./content.js";
import { ScrollAreaScrollbar } from "./scrollbar.js";
import { ScrollAreaThumb } from "./thumb.js";
import { ScrollAreaCorner } from "./corner.js";

export const kit = defineKitComponent(passport, {
  root: ScrollArea,
  viewport: ScrollAreaViewport,
  content: ScrollAreaContent,
  scrollbar: ScrollAreaScrollbar,
  thumb: ScrollAreaThumb,
  corner: ScrollAreaCorner,
});
