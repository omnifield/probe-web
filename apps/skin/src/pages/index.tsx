import {
  Workspace,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Flow,
  FlowItem,
} from "@web-core/ui";
import { Outlet } from "@web-core/router";
import { layoutSelf } from "@web-core/skin";
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
        <Tree />
      </WorkspaceSidebar>

      <WorkspaceHeader>
        <Header />
      </WorkspaceHeader>

      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>

      <WorkspaceRightbar>
        <Flow data-variant="column-center">
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Info />
          </FlowItem>
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Input />
          </FlowItem>
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Output />
          </FlowItem>
        </Flow>
      </WorkspaceRightbar>
    </Workspace>
  );
}
