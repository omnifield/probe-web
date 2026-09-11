import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import { splitProps, type ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type WorkspaceProps<T extends ValidComponent = "div"> = PolymorphicProps<T> & {
  outlined?: boolean;
  filled?: boolean;
};

export const Workspace = slotAware(function Workspace<T extends ValidComponent = "div">(props: WorkspaceProps<T>) {
  useKitLife(passport, props);

  const [local, others] = splitProps(props, ["outlined", "filled"]);
  const [address, rest] = useAddress(others, anatomyParts.root.attrs);

  return (
    <Polymorphic
      as="div"
      {...rest}
      {...address}
      data-outlined={local.outlined ? "true" : undefined}
      data-filled={local.filled === false ? undefined : "true"}
    />
  );
});
