// ВИТРИНА — вход, а не раскладка (`PWEB-151`).
//
// РАСКЛАДКИ ЗДЕСЬ БОЛЬШЕ НЕТ — она в `./shell.tsx`, прямым JSX поверх `Workspace` (`PWEB-161`,
// решение user 2026-08-27: пять готовых экранов по пяти слотам — не анатомия, которую надо
// варьировать через `RenderTree`, а обычная композиция, `shell.tsx` объясняет разницу подробно).
// Здесь, в `App`, только состояние и его передача вниз.
//
// СОСТОЯНИЕ — ДВЕ НЕЗАВИСИМЫЕ ОСИ, каждая в своём файле:
//
//   • ПРОСМОТР (`../pages/showcase/model/browse.ts`) — какой компонент открыт, что из него видно;
//   • НАДЕТОЕ (`../pages/showcase/model/wearing.ts`) — какой скин выбран, в какой половине.

import { createBrowseState } from "../pages/showcase/model/browse.js";
import { createConsoleState } from "../pages/showcase/model/console.js";
import { createWearingState } from "../pages/showcase/model/wearing.js";
import { Shell } from "./shell.jsx";

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
    <Shell
      browse={browse}
      wearing={wearing}
      consoleState={consoleState}
      variants={variants}
    />
  );
}
