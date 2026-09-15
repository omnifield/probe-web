import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Toast,
  WorkspaceMain,
} from "@web-core/ui";

import { tree } from "#/entities/component";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { FeedManual } from "#/features/component-manager";

export function ShowcasePage() {
  const selection = useRouterCatalogSelection(
    "/showcase/{-$component}/{-$view}",
  );

  return (
    <Workspace data-variant="multi-column" outlined>
      <Toast />
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        <FeedManual component={selection.activeValue} />
      </WorkspaceRightbar>
    </Workspace>
  );
}
