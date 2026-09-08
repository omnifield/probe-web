import { anatomy as tocAnatomy } from "@zag-js/toc/anatomy";

// `content`/`nav` не существуют в анатомии Zag вовсе — оба целиком придуманы китом (реальная
// композиция отдаёт их как голые `<article>`/`<nav>`, без своего data-scope/data-part).
// `.extendWith(...)` даёт им настоящий адрес, чтобы скин мог одеть их отдельно от `root`.
export const anatomy = tocAnatomy.extendWith("content", "nav");

export const anatomyParts = anatomy.build();
