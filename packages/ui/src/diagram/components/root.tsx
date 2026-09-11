import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";

export type DiagramRootProps = Omit<JSX.SvgSVGAttributes<SVGSVGElement>, "width" | "height"> & {
  width?: number;
  height?: number;
};

export function DiagramRoot(props: DiagramRootProps) {
  useKitLife(passport, props);

  const [local, rest] = splitProps(props, ["width", "height"]);

  return (
    <svg
      {...dropAddress(rest)}
      width={local.width}
      height={local.height}
      viewBox={`0 0 ${local.width ?? 0} ${local.height ?? 0}`}
      {...anatomyParts.root.attrs}
    />
  );
}
