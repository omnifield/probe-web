// MAP of the splitter: passport part → the component that draws it (`PWEB-84`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Splitter, SplitterPanel, SplitterResizeTrigger, SplitterResizeTriggerIndicator } from "./index.jsx";

/** The splitter's passport together with whatever draws each of its four parts. */
export const kit = defineKitComponent(passport, {
  root: Splitter,
  panel: SplitterPanel,
  resizeTrigger: SplitterResizeTrigger,
  resizeTriggerIndicator: SplitterResizeTriggerIndicator,
});
