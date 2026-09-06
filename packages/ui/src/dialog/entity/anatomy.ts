import { anatomy as dialogAnatomy } from "@zag-js/dialog/anatomy";

// `trigger` → `control`, кит-словарь как у accordion/popover — см. FAQ.md.
export const anatomy = dialogAnatomy.omit("trigger", "positioner", "title", "description").extendWith("control");

export const anatomyParts = anatomy.build();
