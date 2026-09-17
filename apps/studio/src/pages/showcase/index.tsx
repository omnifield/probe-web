import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { tree } from "#/entities/component";
import { ComponentManagerProvider } from "#/features/component-manager";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { Control } from "#/widgets/component-manager";

export function ShowcasePage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <ComponentManagerProvider name={selection.activeValue}>
        <WorkspaceMain style={{ padding: 0 }}>
          <Outlet />
        </WorkspaceMain>
        <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
          <Control />
        </WorkspaceRightbar>
      </ComponentManagerProvider>
    </Workspace>
  );
}
