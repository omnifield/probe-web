import { anatomy as accordionAnatomy } from "@zag-js/accordion/anatomy";

import { parts } from "../../shared/data/anatomy.js";

export const anatomy = accordionAnatomy
  .omit("itemTrigger", "itemContent", "itemIndicator")
  .extendWith(...parts.controlSet, ...parts.content);

export const anatomyParts = anatomy.build();
