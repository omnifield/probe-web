import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, Typography } from "@web-core/ui";

export function Loader() {
  return (
    <Flow
      style={{
        ...layoutGroup({ align: "center", justify: "center" }),
        ...layoutSelf({ grow: true, align: "stretch" }),
        height: "100%",
      }}
    >
      <Typography>Загрузка…</Typography>
    </Flow>
  );
}
