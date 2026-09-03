import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export type DiagramRootProps = Omit<JSX.SvgSVGAttributes<SVGSVGElement>, "width" | "height"> & {
  width?: number;
  height?: number;
};

export function DiagramRoot(props: DiagramRootProps) {
  traceLife("ui.diagram");

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
