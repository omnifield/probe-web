import {
  createToaster,
  type CreateToasterProps,
  type CreateToasterReturn,
} from "@ark-ui/solid/toast";

let instance: CreateToasterReturn | undefined;

export function getToaster(options?: CreateToasterProps): CreateToasterReturn {
  instance ??= createToaster(options ?? { placement: "bottom" });
  return instance;
}

type ToastTrigger = Pick<
  CreateToasterReturn,
  | "create"
  | "update"
  | "remove"
  | "dismiss"
  | "success"
  | "error"
  | "info"
  | "warning"
  | "loading"
  | "promise"
  | "pause"
  | "resume"
>;

export const toast: ToastTrigger = {
  create: (...args) => getToaster().create(...args),
  update: (...args) => getToaster().update(...args),
  remove: (...args) => getToaster().remove(...args),
  dismiss: (...args) => getToaster().dismiss(...args),
  success: (...args) => getToaster().success(...args),
  error: (...args) => getToaster().error(...args),
  info: (...args) => getToaster().info(...args),
  warning: (...args) => getToaster().warning(...args),
  loading: (...args) => getToaster().loading(...args),
  promise: (...args) => getToaster().promise(...args),
  pause: (...args) => getToaster().pause(...args),
  resume: (...args) => getToaster().resume(...args),
};
