// ШАПКА ВИТРИНЫ — заголовок и переключатель темы. Содержимое `WorkspaceHeader`, не сам слот:
// раскладку (флекс, отступы) держит страница (`pages/index.tsx`), тем же приёмом, что и у
// `ComponentList`/`WorkspaceSidebar`.
import { ThemeSwitch } from "#/shared/ui/theme-switch/index.jsx";

export function Header() {
  return (
    <>
      <h1>web-core — витрина</h1>
      <ThemeSwitch />
    </>
  );
}
