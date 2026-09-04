import { type Accessor, createMemo, splitProps } from "solid-js";

import { cn } from "./cn.js";

export type VariantFn<P> = (props: P) => string;

export function createStyle<const P extends Record<string, unknown>>(
  variants: VariantFn<NoInfer<P>>,
  props: P & { class?: string | undefined },
): Accessor<string> {
  const [local, rest] = splitProps(props, ["class"]);

  const cls = createMemo(() => cn(variants(rest as unknown as P), local.class));
  return cls;
}
