// ВИТРИНА — вход, а не раскладка (`PWEB-151`).
//
// РАСКЛАДКИ ЗДЕСЬ БОЛЬШЕ НЕТ. Каркас — тоже СБОРКА (`./shell.ts`), тем же движком, которым
// рисуются случаи в галерее и одевается любой компонент кита: дерево объявлено данными,
// `RenderTree` его читает. Ручной JSX-вёрстки `<Workspace><WorkspaceSidebar>…` здесь не будет —
// это и есть та подмена, от которой ушли (решение user, PWEB-151): движок для того и чинился всю
// сессию (`extras`/`PWEB-152`, провайдер/`PWEB-153`), чтобы дерево умело нести настоящие живые
// компоненты, а не только паспортные части.
//
// СОСТОЯНИЕ — ДВЕ НЕЗАВИСИМЫЕ ОСИ, каждая в своём файле:
//
//   • ПРОСМОТР (`../pages/showcase/model/browse.ts`) — какой компонент открыт, что из него видно;
//   • НАДЕТОЕ (`../pages/showcase/model/wearing.ts`) — какой скин выбран, в какой половине.

import { RenderTree } from "@omnifield/probe-web-assembly";
import { createMemo } from "solid-js";

import { createBrowseState } from "../pages/showcase/model/browse.js";
import { createConsoleState } from "../pages/showcase/model/console.js";
import { createWearingState } from "../pages/showcase/model/wearing.js";
import { SHELL_REGISTRY, shellTree } from "./shell.js";

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

  // ЯВНО СЛЕЖЕНИЕ, А НЕ НАДЕЖДА НА ЯВНЫЙ ГЕТТЕР КОМПИЛЯТОРА: дерево строит функция с четырьмя
  // разными сигналами внутри разом (`browse`+`wearing`), и заворачивать её в `createMemo` здесь
  // надёжнее, чем полагаться на то, что JSX-компилятор Solid угадает реактивность вложенного
  // вызова через проп `tree` сам, — живой пробой поймано, что без этого клик по рельсам не
  // трогает показ: пропы застревали значением первого кадра.
  const tree = createMemo(() => shellTree(browse, wearing, consoleState, variants));

  return <RenderTree tree={tree()} registry={SHELL_REGISTRY} />;
}
