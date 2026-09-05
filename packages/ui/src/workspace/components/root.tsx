import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import { splitProps, type ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceProps<T extends ValidComponent = "div"> = PolymorphicProps<T> & {
  outlined?: boolean;
};

export const Workspace = slotAware(function Workspace<T extends ValidComponent = "div">(props: WorkspaceProps<T>) {
  traceLife("ui.workspace");

  const [local, others] = splitProps(props, ["outlined"]);
  const [address, rest] = useAddress(others, anatomyParts.root.attrs);

  return (
    <Polymorphic
      as="div"
      {...rest}
      {...address}
      data-outlined={local.outlined ? "true" : undefined}
    />
  );
});
