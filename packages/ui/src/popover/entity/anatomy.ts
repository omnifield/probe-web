import { anatomy as popoverAnatomy } from "@zag-js/popover/anatomy";

import { parts } from "../../shared/data/anatomy.js";

export const anatomy = popoverAnatomy.omit("trigger", "indicator").extendWith(...parts.controlSet);

export const anatomyParts = anatomy.build();
