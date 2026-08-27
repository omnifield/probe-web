// MAP of the scroll area: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "./index.jsx";

/** The scroll area's passport together with whatever draws each of its six parts. */
export const kit = defineKitComponent(passport, {
  root: ScrollArea,
  viewport: ScrollAreaViewport,
  content: ScrollAreaContent,
  scrollbar: ScrollAreaScrollbar,
  thumb: ScrollAreaThumb,
  corner: ScrollAreaCorner,
});
