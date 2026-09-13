import {
  Workspace,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Toast,
} from "@web-core/ui";
import { Outlet, useLocation, useNavigate, useParams } from "@web-core/router";
import { railVar } from "@web-core/skin";
import { Show } from "solid-js";

import { treeItems } from "#/entities/component/model/catalog-tree";
import { Header } from "#/widgets/header";
import { CatalogTree } from "#/widgets/catalogs";

export function WorkspaceLayout() {
  const location = useLocation();
  const isLab = () => location().pathname.startsWith("/lab");

  const params = useParams({ strict: false, select: (p) => p.component });

  const navigate = useNavigate();
  const onSelect = (value: string) => {
    const screen = isLab() ? "/lab/$component" : "/showcase/$component";
    void navigate({ to: screen, params: { component: value } });
  };

  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <Toast />
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree
          adapter={treeItems}
          activeValue={params()}
          onSelect={onSelect}
        />
      </WorkspaceSidebar>
      <WorkspaceHeader>
        <Header />
      </WorkspaceHeader>

      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        {/* <Show when={isLab()} fallback={<RightbarShowcase />}>
          <RightbarLab />
        </Show> */}
      </WorkspaceRightbar>
    </Workspace>
  );
}
