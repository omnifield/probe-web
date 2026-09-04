import { splitProps } from "solid-js";

import { ADDRESS } from "./address.js";

const SLOT_AWARE = Symbol.for("web-core-ui.slot-aware");

export interface SlotChainProps {
  __slot?: string;
}

export function slotAware<C>(component: C): C {
  (component as { [SLOT_AWARE]?: boolean })[SLOT_AWARE] = true;

  return component;
}

function isSlotAware(as: unknown): boolean {
  return typeof as === "function" && (as as { [SLOT_AWARE]?: boolean })[SLOT_AWARE] === true;
}

export function useSlot<P extends SlotChainProps & { as?: unknown }>(props: P, own: string) {
  const [, rest] = splitProps(props, ["__slot"]);

  const chain = () => (props.__slot ? `${own} ${props.__slot}` : own);

  const slot = {
    get "data-slot"() {
      return isSlotAware(props.as) ? undefined : chain();
    },
    get __slot() {
      return isSlotAware(props.as) ? chain() : undefined;
    },
  };

  return [slot, rest] as const;
}

export function dropAddress<P extends object>(props: P): P {
  const [, rest] = splitProps(props as P & Record<(typeof ADDRESS)[number], unknown>, [...ADDRESS]);

  return rest as P;
}

export function useAddress<P extends object & { as?: unknown }>(
  props: P,
  attrs: Readonly<Record<string, string>>,
) {
  const address: Record<string, string | undefined> = {};

  for (const name of Object.keys(attrs)) {
    Object.defineProperty(address, name, {
      enumerable: true,
      get: () => (isSlotAware(props.as) ? undefined : attrs[name]),
    });
  }

  return [address as Readonly<Record<string, string | undefined>>, dropAddress(props)] as const;
}
