// ЛАЙАУТ ВОРКСПЕЙСА (`PWEB-173`).
//
// УПРОЩЁН: прежний рантайм витрины (`browse`/консоль, `SettingsPanel`/`EventConsole`/
// `ComponentPage` под `pages/showcase/`) снят целиком (решение user, 2026-08-29, история — в
// git). Надетое (`SkinSwitcher`) — восстановлено ОТДЕЛЬНЫМ виджетом, не частью снятого `Head`:
// оно общее на всё приложение (скин один, половина одна), поэтому стоит здесь, в постоянном
// каркасе, а не на странице конкретного маршрута.
//
// `main` внутри `Workspace` — `<Outlet/>` под дочерний маршрут (`routes/_workspace.tsx` — этот
// компонент как pathless-лайаут, `routes/_workspace/{showcase,lab}.tsx` — дети).
//
// ШЕСТЬ СЛОТОВ, ВАРИАЦИЯ `header-full`, `outlined` (`PWEB-174`, постановка user 2026-08-29):
// шапка во всю ширину, рельсы и правая панель тянутся мимо неё вниз, подвал — только под
// показом, между ними (третья вариация, добавлена в `packages/ui/src/workspace/playground/
// recipe.ts` и в живую форму `omnifield-workspace` службы пресетов — рецепт кита и форма
// продукта держатся раздельно, синхронизация ручная). `outlined` — шов+свой фон у каждой ячейки,
// не рамка на каждой (переписано там же, находка про двойную линию на стыках).
//
// НАПОЛНЕНИЕ И ПОКАЗ (`widgets/data-input`/`data-output`) — В ПОДВАЛЕ, не в правой панели
// (постановка user, 2026-08-30, было в правой панели одним заходом раньше — история в git):
// мок «Подвал» снят, правая панель сегодня пустая.
import {
  Workspace,
  WorkspaceFooter,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@omnifield/probe-web-ui";
import { Outlet } from "@omnifield/probe-web-router";

import { ComponentList } from "#/widgets/component-list/component-list.jsx";
import { DataInput } from "#/widgets/data-input/data-input.jsx";
import { DataOutput } from "#/widgets/data-output/data-output.jsx";
import { SkinSwitcher } from "#/widgets/skin-switcher/skin-switcher.jsx";

/** Лайаут воркспейса: постоянный каркас (список компонентов, шапка) вокруг сменного маршрута. */
export function WorkspaceLayout() {
  return (
    // `100dvh` — реальная высота вьюпорта, дело ПРИЛОЖЕНИЯ, не рецепта: сколько весит вьюпорт
    // знает только оно (тем же доводом, что у `Grid`, `packages/ui/src/grid/playground/
    // recipe.ts`) — рецепт `Workspace` своей высоты не задаёт вовсе.
    <Workspace
      data-variant="header-full"
      outlined
      style={{ "block-size": "100dvh" }}
    >
      <WorkspaceSidebar>
        <ComponentList variant="filled" />
      </WorkspaceSidebar>

      <WorkspaceHeader
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
        }}
      >
        <h1>probe-web — витрина</h1>
        <SkinSwitcher />
      </WorkspaceHeader>

      <WorkspaceMain>
        <Outlet />
      </WorkspaceMain>

      <WorkspaceRightbar>
        <DataInput />
      </WorkspaceRightbar>

      <WorkspaceFooter
        style={{ display: "flex", gap: "var(--space-6)", "flex-wrap": "wrap" }}
      >
        <DataOutput />
      </WorkspaceFooter>
    </Workspace>
  );
}
