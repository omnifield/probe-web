// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself. Both read from here, so where files live inside the folder stays this folder's
// own business.

export { Button, type ButtonProps } from "./button.jsx";
export { anatomy, parts, passport } from "./button.anatomy.js";
export { kit } from "./button.kit.js";
