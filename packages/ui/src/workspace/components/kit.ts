// КАРТА рабочей области: часть паспорта → компонент, которым она рисуется (`PWEB-84`, `PWEB-154`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";
import {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "./index.jsx";

/** Паспорт рабочей области вместе с тем, чем рисуется каждый из её шести именованных слотов. */
export const kit = defineKitComponent(passport, {
  root: Workspace,
  header: WorkspaceHeader,
  sidebar: WorkspaceSidebar,
  main: WorkspaceMain,
  rightbar: WorkspaceRightbar,
  footer: WorkspaceFooter,
});
