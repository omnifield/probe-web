import {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@omnifield/probe-web-ui";
import { Outlet } from "@omnifield/probe-web-router";

import { ComponentTree } from "#/widgets/component-tree/component-tree.jsx";
import { Header } from "#/widgets/header/header.jsx";

export function WorkspaceLayout() {
  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <WorkspaceSidebar>
        <ComponentTree />
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

      <WorkspaceRightbar />

      <WorkspaceFooter
        style={{ display: "flex", gap: "var(--space-6)", "flex-wrap": "wrap" }}
      />
    </Workspace>
  );
}
