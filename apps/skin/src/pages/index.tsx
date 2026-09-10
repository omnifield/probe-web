import {
  Workspace,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Toast,
} from "@web-core/ui";
import { Outlet, useLocation } from "@web-core/router";
import { railVar } from "@web-core/skin";
import { Show } from "solid-js";
import { RightbarLab, RightbarShowcase } from "#/widgets/rightbar";
import { Tree } from "#/widgets/component";
import { Header } from "#/widgets/header";

export function WorkspaceLayout() {
  // `WorkspaceRightbar` — позиционный слот `Workspace` (CSS grid-area, не портал/контекст), не
  // достаётся до него из `<Outlet/>` — значит переключение содержимого по маршруту решается
  // здесь, а не в самих страницах. `/lab` — создание (чат), всё остальное — витрина (поля данных),
  // решение user 2026-09-10.
  const location = useLocation();
  const isLab = () => location().pathname.startsWith("/lab");

  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <Toast />
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <Tree />
      </WorkspaceSidebar>
      <WorkspaceHeader>
        <Header />
      </WorkspaceHeader>

      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        <Show when={isLab()} fallback={<RightbarShowcase />}>
          <RightbarLab />
        </Show>
      </WorkspaceRightbar>
    </Workspace>
  );
}
