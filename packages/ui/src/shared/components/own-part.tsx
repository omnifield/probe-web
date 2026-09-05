import type { JSX } from "solid-js";

import { dropAddress } from "../utils/slot-chain.js";
import { traceLife } from "../utils/trace.js";

export function ownPart(name: string, attrs: Readonly<Record<string, string>>) {
  return function OwnPart(props: JSX.HTMLAttributes<HTMLDivElement>) {
    traceLife(name);

    return <div {...dropAddress(props)} {...attrs} />;
  };
}
