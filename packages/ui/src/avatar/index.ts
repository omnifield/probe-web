// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Avatar,
  AvatarFallback,
  type AvatarFallbackProps,
  AvatarImage,
  type AvatarImageProps,
  type AvatarProps,
} from "./components/index.js";
