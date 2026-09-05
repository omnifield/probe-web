export { Workspace, type WorkspaceProps } from "./root.js";
export { WorkspaceHeader, type WorkspaceHeaderProps } from "./header.js";
export { WorkspaceSidebar, type WorkspaceSidebarProps } from "./sidebar.js";
export { WorkspaceMain, type WorkspaceMainProps } from "./main.js";
export { WorkspaceRightbar, type WorkspaceRightbarProps } from "./rightbar.js";
export { WorkspaceFooter, type WorkspaceFooterProps } from "./footer.js";

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import { Workspace } from "./root.js";
import { WorkspaceHeader } from "./header.js";
import { WorkspaceSidebar } from "./sidebar.js";
import { WorkspaceMain } from "./main.js";
import { WorkspaceRightbar } from "./rightbar.js";
import { WorkspaceFooter } from "./footer.js";

export const kit = defineKitComponent(passport, {
  root: Workspace,
  header: WorkspaceHeader,
  sidebar: WorkspaceSidebar,
  main: WorkspaceMain,
  rightbar: WorkspaceRightbar,
  footer: WorkspaceFooter,
});
