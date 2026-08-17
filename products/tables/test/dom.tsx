// Обвязка DOM-тестов зоны.
//
// Форма повторяет обвязку кита (`packages/ui/test/dom.tsx`) сознательно: конструктор стоит
// на его примитивах, и проверять его надо тем же способом — РЕНДЕРОМ в документ, а не сверкой
// структуры модуля. Structural-тест не отличает «компонент экспортируется» от «компонент
// рисует нужный узел», а расходятся они молча.
//
// Своя копия, а не импорт из чужой зоны: `test/` кита в его поверхность не входит, тянуть
// оттуда — значит завязаться на то, что он никому не обещал.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

const mounted: Array<() => void> = [];

/** Монтирует фрагмент в свежий контейнер внутри `document.body` и отдаёт его. */
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

/** Нажатие указателем: `pointerdown` → `pointerup` → `click` (kobalte слушает первое). */
export function press(node: Element): void {
  node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
  node.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }));
  // Событием, а не методом `.click()`: у элементов SVG его нет, а нажимают и по ним тоже.
  node.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
}

/** Ввод текста в поле: значение плюс событие, которое слушает Solid. */
export function type(node: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  node.value = value;
  node.dispatchEvent(new Event("input", { bubbles: true }));
}

/** Единственный элемент по селектору. Падает с внятным текстом, когда его нет. */
export function one<E extends Element = HTMLElement>(host: ParentNode, selector: string): E {
  const node = host.querySelector<E>(selector);
  if (!node) throw new Error(`не нашёлся узел по селектору ${selector}`);
  return node;
}

/**
 * Переключить галку кита.
 *
 * Жать надо по НАСТОЯЩЕМУ `<input type="checkbox">` внутри: корень галки — `div`, он несёт
 * наше имя и состояние, но щелчок по нему ничего не переключает. Прячут ввод оформлением, а
 * не отсутствием, — значит он на месте и по нему же жмут.
 */
export function tick(host: ParentNode, slot: string): void {
  one<HTMLInputElement>(host, `[data-slot~="${slot}"] [data-slot~="checkbox-input"]`).click();
}

/**
 * Выбрать значение в списке кита — по ПОДПИСИ, как это делает человек.
 *
 * Список открывается нажатием и рисует панель в ПОРТАЛЕ, то есть вне поддерева, куда мы
 * монтировали сцену. Поэтому пункт ищется по всему документу: искать его внутри `host` значит
 * не найти никогда.
 */
export function choose(host: ParentNode, slot: string, label: string): void {
  press(one(host, `[data-slot~="${slot}"] [data-slot~="select-trigger"]`));

  const item = all(document.body, '[data-slot~="select-item"]').find(
    (node) => node.textContent?.trim() === label,
  );
  if (!item) throw new Error(`в списке ${slot} нет пункта «${label}»`);

  press(item);
}

/** Все элементы по селектору списком. */
export function all<E extends Element = HTMLElement>(host: ParentNode, selector: string): E[] {
  return [...host.querySelectorAll<E>(selector)];
}
