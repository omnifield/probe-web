import { anatomy as datePickerAnatomy } from "@zag-js/date-picker/anatomy";

// `valueText` в анатомии Zag нет — часть придумана китом, `.extendWith(...)` даёт ей адрес.
export const anatomy = datePickerAnatomy.extendWith("valueText");

export const anatomyParts = anatomy.build();
