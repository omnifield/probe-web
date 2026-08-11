// Обвязка DOM-тестов приложения.
//
// `@solidjs/testing-library` не берём — той же развилкой и тем же решением, что зоны
// `runtime` и `ui` (сверено 2026-08-08): её последний выпуск 0.8.10 от 2024-09 тянет peer
// `@solidjs/router`, а `render` у Solid есть свой. Приложению здесь важнее прямота: чем
// меньше слоёв между тестом и документом, тем точнее видно, что именно сломалось в шве.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

const mounted: Array<() => void> = [];

/** Монтирует фрагмент в свежий контейнер внутри `document.body` и отдаёт контейнер. */
export function mount(code: () => JSX.Element): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  mounted.push(render(code, host));
  return host;
}

/** Снимает смонтированное и чистит документ. Зовётся в `afterEach`. */
export function cleanup(): void {
  for (const dispose of mounted.splice(0)) dispose();
  document.body.innerHTML = "";
  // Тема живёт на `documentElement` — состояние глобальное, и его обязан снимать тест,
  // иначе следующий стартует в чужом режиме.
  document.documentElement.classList.remove("dark");
  document.documentElement.removeAttribute("data-theme");
}

/** Единственный элемент по селектору; падает с внятным текстом, когда его нет. */
export function one<E extends Element = HTMLElement>(host: ParentNode, selector: string): E {
  const node = host.querySelector<E>(selector);
  if (!node) throw new Error(`не нашёлся узел по селектору ${selector}`);
  return node;
}

/**
 * Нажатие УКАЗАТЕЛЕМ: `pointerdown` → `pointerup` → `click`.
 *
 * Голого `.click()` для kobalte мало: оверлейные компоненты открываются по `pointerdown`,
 * чтобы панель успела появиться до ухода фокуса с триггера.
 */
export function press(node: Element): void {
  node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
  node.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
  (node as HTMLElement).click();
}

/** Ввод текста в поле так, как его вводит человек: значение плюс событие `input`. */
export function type(node: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  node.value = value;
  node.dispatchEvent(new Event("input", { bubbles: true }));
}
