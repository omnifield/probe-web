// ТОЧКА СБОРКИ ПРИЛОЖЕНИЯ — вход, а не раскладка (`PWEB-151`).
//
// РАСКЛАДКИ ЗДЕСЬ НЕТ — она в `../pages/workspace/ui/layout.tsx`, прямым JSX поверх `Workspace`
// (`PWEB-161`, решение user 2026-08-27: пять готовых экранов по пяти слотам — не анатомия,
// которую надо варьировать через `RenderTree`, а обычная композиция, `layout.tsx` объясняет
// разницу подробно). `app/` держит только верхние уровни — вход и состояние; страницы, лайауты,
// рельсы живут в `pages/` (`PWEB-162`).
//
// СОСТОЯНИЕ — ДВЕ НЕЗАВИСИМЫЕ ОСИ, каждая в своём файле:
//
//   • ПРОСМОТР (`../pages/showcase/model/browse.ts`) — какой компонент открыт, что из него видно;
//   • НАДЕТОЕ (`../pages/showcase/model/wearing.ts`) — какой скин выбран, в какой половине.

import { createBrowseState } from "../pages/showcase/model/browse.js";
import { createConsoleState } from "../pages/showcase/model/console.js";
import { createWearingState } from "../pages/showcase/model/wearing.js";
import { WorkspaceLayout } from "../pages/workspace/ui/layout.jsx";

export function App() {
  const browse = createBrowseState();
  const wearing = createWearingState();
  // КОНСОЛЬ СОБЫТИЙ (`PWEB-157`) — одна на всю витрину, ОТДЕЛЬНАЯ ОСЬ от `browse`/`wearing`:
  // лог не сбрасывается при смене компонента, человек листает историю кликов по РАЗНЫМ
  // компонентам подряд, а не только текущему.
  const consoleState = createConsoleState();

  /** Имена вариаций надетого скина для показанного компонента. Нет скина — называть нечего. */
  const variants = (): readonly string[] =>
    Object.keys(wearing.wornSkin()?.recipes[browse.current()]?.variants ?? {});

  return (
    <WorkspaceLayout
      browse={browse}
      wearing={wearing}
      consoleState={consoleState}
      variants={variants}
    />
  );
}
