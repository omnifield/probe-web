// ЛОАДЕР ПОКАЗА — стоит РОВНО на месте `Renderer`, пока данные компонента едут: контрол сборок,
// карусель и её размер (`slotSizeOf`) остаются на экране, подменяется только показываемое.
// Своей графики здесь нет намеренно (решение user 2026-08-27, см. `index.html`): витрина
// собрана из компонентов кита, одетых тем же нарядом, что показывает, — крутящегося спиннера
// в ките нет, поэтому ожидание сказано словом.
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
