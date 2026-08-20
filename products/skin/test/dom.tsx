// Обвязка проб отрисовки: монтируем в НАСТОЯЩИЙ документ и спрашиваем узлы.
//
// Предмет витрины — то, что видит человек, и сверка модулей об этом не говорит ничего. Форма
// та же, что у зон `assembly`, `ui` и `runtime`: `render` из `solid-js/web` без тестовой
// библиотеки — она здесь ничего не добавляет.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

/** Контейнеры и их деструкторы за текущую пробу — снимаются в `cleanup()`. */
const mounted: Array<() => void> = [];

/**
 * Монтирует фрагмент в свежий контейнер внутри `document.body` и отдаёт контейнер.
 *
 * @param code фрагмент под проверку
 */
export function mount(code: () => JSX.Element): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  mounted.push(render(code, host));
  return host;
}

/** Снимает всё смонтированное и чистит документ. Зовётся в `afterEach`. */
export function cleanup(): void {
  for (const dispose of mounted.splice(0)) dispose();
  document.body.innerHTML = "";
}
