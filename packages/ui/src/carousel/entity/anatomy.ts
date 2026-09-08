import { anatomy as carouselAnatomy } from "@zag-js/carousel/anatomy";

// `autoplayIndicator` в анатомии Zag нет — часть придумана китом, `.extendWith(...)` даёт ей адрес.
export const anatomy = carouselAnatomy.extendWith("autoplayIndicator");

export const anatomyParts = anatomy.build();
