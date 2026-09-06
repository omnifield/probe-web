import {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { Outlet } from "@web-core/router";

import { Input, Tree } from "#/widgets/component";
import { Header } from "#/widgets/header";

export function WorkspaceLayout() {
  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <WorkspaceSidebar>
        <Tree />
      </WorkspaceSidebar>

      <WorkspaceHeader
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
        }}
      >
        <Header />
      </WorkspaceHeader>

      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>

      <WorkspaceRightbar>
        <Input />
      </WorkspaceRightbar>

      <WorkspaceFooter
        style={{ display: "flex", gap: "var(--space-6)", "flex-wrap": "wrap" }}
      />
    </Workspace>
  );
}
