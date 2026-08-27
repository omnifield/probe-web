// What leaves this folder outward.
//
// Two different things, two different readers: MARKUP is picked up by the primitives entry
// (`src/index.ts`), the PASSPORT by the `./passport` build, which walks folders and assembles the
// list itself.

export {
  createToaster,
  type CreateToasterProps,
  type CreateToasterReturn,
  Toaster,
  type ToasterProps,
  ToastActionTrigger,
  type ToastActionTriggerProps,
  ToastCloseTrigger,
  type ToastCloseTriggerProps,
  ToastDescription,
  type ToastDescriptionProps,
  ToastRoot,
  type ToastRootProps,
  ToastTitle,
  type ToastTitleProps,
} from "./components/index.jsx";
export { kit } from "./components/kit.js";
export { anatomy, anatomyParts, passport } from "./entity";
