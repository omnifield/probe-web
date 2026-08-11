// Общая обвязка DOM-тестов зоны.
//
// Тест каждого примитива — RENDER в документ, а не сверка структуры модуля. Это требование
// ТЗ и оно с историей: в оракуле «миграция structural→render не доведена» была главным гэпом
// кита, и полгода отчёт утверждал несуществующий блокер. Structural-тест не отличает
// «компонент экспортируется» от «компонент рендерит нужный узел» — а расходятся они молча.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

/** Контейнеры и их деструкторы за текущий тест — снимаются в `cleanup()`. */
const mounted: Array<() => void> = [];

/**
 * Монтирует фрагмент в СВЕЖИЙ контейнер внутри `document.body` и отдаёт его.
 *
 * Контейнер настоящий и в документе: `:focus-visible`, `for`↔`id` и фокус-порядок вне
 * документа не работают, а именно их примитивы и обеспечивают.
 *
 * @param code фрагмент под проверку
 * @returns контейнер, в который он смонтирован
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

/**
 * Нажатие УКАЗАТЕЛЕМ: `pointerdown` → `pointerup` → `click`.
 *
 * Голого `.click()` для kobalte мало и это не придирка: оверлейные компоненты открываются по
 * `pointerdown`, чтобы панель успела появиться до того, как фокус уйдёт с триггера. Тест,
 * дёргающий только `click`, проверял бы поведение, которого у компонента нет.
 */
export function press(node: Element): void {
  node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
  node.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
  (node as HTMLElement).click();
}

/**
 * Единственный элемент по селектору. Падает с внятным текстом, когда его нет, — иначе
 * ошибка приезжает как `null.textContent` строкой ниже и не называет причину.
 */
export function one<E extends Element = HTMLElement>(host: ParentNode, selector: string): E {
  const node = host.querySelector<E>(selector);
  if (!node) throw new Error(`не нашёлся узел по селектору ${selector}`);
  return node;
}
