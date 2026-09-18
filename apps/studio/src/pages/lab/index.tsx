import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { tree } from "#/entities/component";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { Chat } from "#/widgets/chat";
import { createSignal } from "solid-js";
// import {
//   OpenapiEditor,
//   type OpenapiGroup,
//   type OpenapiInvocation,
// } from "@web-core/feeder";
// function OpenapiManualGroupDemo() {
//   const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>([]);

//   return (
//     <OpenapiEditor
//       groups={groups()}
//       onGroupsChange={setGroups}
//       onChange={(invocation: OpenapiInvocation) => console.log(invocation)}
//     />
//   );
// }

export function LabPage() {
  const selection = useRouterCatalogSelection("/lab/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        <Chat />
        {/* <OpenapiManualGroupDemo /> */}
      </WorkspaceRightbar>
    </Workspace>
  );
}
