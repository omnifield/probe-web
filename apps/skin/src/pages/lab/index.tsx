import { setCurrentComponent } from "#/entities/component";

import { createEffect } from "solid-js";

// `component` необязателен — прямой заход на голый "/lab" (ничего ещё не выбирали) существует
// как маршрут (`_workspace.lab.tsx`) наравне с "/lab/$component" (`_workspace.lab.$component.tsx`,
// тот же приём, что у showcase). Без параметра `currentComponent` не трогаем — не заход "очистить
// выбор", а заход "выбора ещё не было".
export function LabPage(props: { component?: string }) {
  createEffect(() => {
    if (props.component !== undefined) setCurrentComponent(props.component);
  });

  return "";
}
