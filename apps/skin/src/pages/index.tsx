import {
  Workspace,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Flow,
  FlowItem,
  Toast,
} from "@web-core/ui";
import { Outlet } from "@web-core/router";
import { layoutSelf } from "@web-core/skin";
import { Chat } from "#/entities/chat";
import { Info, Input, Tree } from "#/widgets/component";
import { Header } from "#/widgets/header";

export function WorkspaceLayout() {
  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <Toast />

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
            {/* <Info /> */}
          </FlowItem>
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Input />
          </FlowItem>
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Chat />
          </FlowItem>
        </Flow>
      </WorkspaceRightbar>
    </Workspace>
  );
}
