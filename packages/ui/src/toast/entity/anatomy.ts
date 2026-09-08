import { anatomy as toastAnatomy } from "@zag-js/toast/anatomy";

export const anatomy = toastAnatomy.omit("actionTrigger");

export const anatomyParts = anatomy.build();
