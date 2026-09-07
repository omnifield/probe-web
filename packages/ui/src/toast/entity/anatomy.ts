import { anatomy as toastAnatomy } from "@zag-js/toast/anatomy";

export const anatomy = toastAnatomy.omit("group", "title", "description", "actionTrigger", "closeTrigger");

export const anatomyParts = anatomy.build();
