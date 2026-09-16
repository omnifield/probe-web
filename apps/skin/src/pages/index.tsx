import { Outlet } from "@web-core/router";
import { Toast, Workspace, WorkspaceHeader, WorkspaceMain } from "@web-core/ui";
import { Header } from "#/widgets/header";

export function WorkspaceLayout() {
  return (
    <Workspace data-variant="stacked" outlined>
      <Toast />
      <WorkspaceHeader>
        <Header />
      </WorkspaceHeader>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
    </Workspace>
  );
}
