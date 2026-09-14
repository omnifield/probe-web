import {
  Workspace,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  Toast,
} from "@web-core/ui";
import { Outlet, useLocation, useNavigate, useParams } from "@web-core/router";
import { railVar } from "@web-core/skin";

import { tree } from "#/entities/component";
import { FeedData } from "#/entities/feeder";
import { Header } from "#/widgets/header";
import { CatalogTree } from "#/widgets/catalogs";

export function WorkspaceLayout(props: {
  location: ReturnType<typeof useLocation>;
  params: ReturnType<typeof useParams>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const isLab = () => props.location().pathname.startsWith("/lab");

  const onSelect = (value: string) => {
    const screen = isLab() ? "/lab/{-$component}" : "/showcase/{-$component}";
    void props.navigate({ to: screen, params: { component: value } });
  };

  return (
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <Toast />
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree
          adapter={tree}
          activeValue={props.params().component}
          onSelect={onSelect}
        />
      </WorkspaceSidebar>
      <WorkspaceHeader>
        <Header />
      </WorkspaceHeader>

      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        <FeedData />
      </WorkspaceRightbar>
    </Workspace>
  );
}
