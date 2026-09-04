// What leaves this product outward. Same split as `@web-core/ui`: MARKUP (this entry)
// for direct use, PASSPORT (`./passport`) as pure data — a reader without Solid must still be
// able to walk it, the same reason the kit keeps its own two entries apart.

export { Xy, XyAxis, type XyAxisOrientation, type XyAxisProps, type XyProps } from "./xy/index.jsx";
export { defineKitComponent, KIT, kitOf, type KitComponent, type PartComponent } from "./kit.js";
