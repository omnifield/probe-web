import {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Surface,
  Flow,
} from "@web-core/ui";
import { Outlet } from "@web-core/router";

import { Info, Input, Output, Tree } from "#/widgets/component";
import { Header } from "#/widgets/header";

export function WorkspaceLayout() {
  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <WorkspaceSidebar>
        <Surface data-variant="filled">
          <Tree />
        </Surface>
      </WorkspaceSidebar>

      <WorkspaceHeader>
        <Flow>
          <Header />
        </Flow>
      </WorkspaceHeader>

      <WorkspaceMain>
        <Surface data-variant="filled">
          <Outlet />
        </Surface>
      </WorkspaceMain>

      <WorkspaceRightbar>
        <Surface data-variant="filled">
          <Flow data-variant="column-center">
            <Info />
            <Input />
            <Output />
          </Flow>
        </Surface>
      </WorkspaceRightbar>
    </Workspace>
  );
}
