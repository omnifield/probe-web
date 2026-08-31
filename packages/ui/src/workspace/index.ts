// Что уезжает из папки компонента наружу.
//
// Две разные вещи и два разных читателя: РАЗМЕТКУ забирает вход примитивов (`src/index.ts`),
// ПАСПОРТ — сборка подпути `./passport`, которая обходит папки и собирает перечень сама.

export {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
  type WorkspaceFooterProps,
  type WorkspaceHeaderProps,
  type WorkspaceMainProps,
  type WorkspaceProps,
  type WorkspaceRightbarProps,
  type WorkspaceSidebarProps,
} from "./components/index.js";
