import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { tree } from "#/entities/component";
import { FeedManual, FeedPreset } from "#/features/component-manager";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";

export function ShowcasePage() {
  const selection = useRouterCatalogSelection(
    "/showcase/{-$component}/{-$view}",
  );

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        <FeedManual component={selection.activeValue} />
        <FeedPreset component={selection.activeValue} />
      </WorkspaceRightbar>
    </Workspace>
  );
}
