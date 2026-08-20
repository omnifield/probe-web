// Обвязка проб на живом ките.
//
// Дерево монтируется в НАСТОЯЩИЙ документ: предмет проверки — то, что порождённый селектор
// цепляется за настоящий узел настоящего компонента, а сверка строк об этом не говорит ничего.
// Своей обвязки монтирования не нужно — `render` из `solid-js/web` делает ровно это (то же
// решение у зон `ui`, `runtime` и `assembly`).

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

/** Деструкторы смонтированного за текущую пробу. */
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
  for (const sheet of document.head.querySelectorAll("style")) sheet.remove();
}
