// What leaves this folder outward. Same split as every kit component: MARKUP for direct use,
// PASSPORT for the `./passport` build (`scripts/generate.mjs` walks this folder).

export {
  Xy,
  XyAxis,
  type XyAxisOrientation,
  type XyAxisProps,
  type XyProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
