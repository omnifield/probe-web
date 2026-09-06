import { tocAnatomy } from "@ark-ui/solid/anatomy";

// `content`/`nav` не существуют в анатомии Zag вовсе — оба целиком придуманы китом (реальная
// композиция Ark их отдаёт как голые `<article>`/`<nav>`, без своего data-scope/data-part).
// `.extendWith(...)` даёт им настоящий адрес, чтобы скин мог одеть их отдельно от `root`.
export const anatomy = tocAnatomy.extendWith("content", "nav");

export const anatomyParts = anatomy.build();
