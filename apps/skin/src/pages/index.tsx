import {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Surface,
  Flow,
  FlowItem,
} from "@web-core/ui";
import { Outlet } from "@web-core/router";
import { layoutSelf, railVar } from "@web-core/skin";
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
        <Surface data-variant="filled">
          <Header />
        </Surface>
      </WorkspaceHeader>

      <WorkspaceMain>
        <Surface data-variant="filled">
          <Outlet />
        </Surface>
      </WorkspaceMain>

      <WorkspaceRightbar>
        <Surface data-variant="filled">
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
        </Surface>
      </WorkspaceRightbar>
    </Workspace>
  );
}
