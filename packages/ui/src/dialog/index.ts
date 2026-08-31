// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  Dialog,
  DialogBackdrop,
  type DialogBackdropProps,
  DialogCloseTrigger,
  type DialogCloseTriggerProps,
  DialogContent,
  type DialogContentProps,
  DialogDescription,
  type DialogDescriptionProps,
  DialogPositioner,
  type DialogPositionerProps,
  type DialogProps,
  DialogTitle,
  type DialogTitleProps,
  DialogTrigger,
  type DialogTriggerProps,
} from "./components/index.js";
