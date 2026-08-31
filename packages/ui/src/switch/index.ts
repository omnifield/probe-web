// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Switch,
  type SwitchProps,
  SwitchControl,
  type SwitchControlProps,
  SwitchThumb,
  type SwitchThumbProps,
  SwitchLabel,
  type SwitchLabelProps,
  SwitchHiddenInput,
  type SwitchHiddenInputProps,
} from "./components/index.js";
