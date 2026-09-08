import { anatomy as listboxAnatomy } from "@zag-js/listbox/anatomy";

// `empty` в анатомии Zag нет — часть придумана китом, `.extendWith(...)` даёт ей адрес.
export const anatomy = listboxAnatomy.extendWith("empty");

export const anatomyParts = anatomy.build();
