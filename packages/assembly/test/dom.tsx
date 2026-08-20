// Общая обвязка проб отрисовки.
//
// Дерево монтируется в НАСТОЯЩИЙ документ и проверяется по узлам: предмет зоны — вид,
// собранный из данных, и сверка структуры модуля о нём не говорит ничего. Своей обвязки
// монтирования у Solid и не нужно — `render` из `solid-js/web` делает ровно это (та же
// развилка и то же решение у зон `ui` и `runtime`: `@solidjs/testing-library` не берём).

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
