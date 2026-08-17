// Общая обвязка DOM-тестов зоны.
//
// Тест каждого примитива — RENDER в документ, а не сверка структуры модуля. Это требование
// ТЗ и оно с историей: в оракуле «миграция structural→render не доведена» была главным гэпом
// кита, и полгода отчёт утверждал несуществующий блокер. Structural-тест не отличает
// «компонент экспортируется» от «компонент рендерит нужный узел» — а расходятся они молча.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

/**
 * Заглушка `ResizeObserver` — его нет в JSDOM, а `@kobalte/core` его требует.
 *
 * Нужна ровно одному примитиву: полоска-указатель вкладок следит за размером активной вкладки
 * и без наблюдателя падает на монтировании. Заглушка ничего не измеряет и не должна: размеры
 * в JSDOM всё равно нулевые, а предмет проверок здесь — узлы, зацепки и связи, а не геометрия.
 * Геометрию проверяют глазами на стенде, и это работа зоны `skin`.
 */
if (!("ResizeObserver" in globalThis)) {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}

/**
 * JSDOM бросает исключение на невалидном значении CSS — браузер такое молча отбрасывает.
 *
 * Ловится на ползунке: до первой раскладки доля бегунка ещё не посчитана, и `@kobalte/core`
 * успевает выставить `left: calc(NaN%)`. В браузере объявление просто игнорируется и следующим
 * тактом заменяется верным; в JSDOM (`cssstyle` поверх `css-tree`) оно роняет РЕНДЕР целиком,
 * и падает не проверка стиля, а вообще всё, что рисует ползунок.
 *
 * Поэтому приводим поведение к браузерному: неразобранное значение не ставится и молчит.
 * Проверять ЗНАЧЕНИЯ стилей это не мешает — верные значения ставятся как прежде.
 */
const style = globalThis.CSSStyleDeclaration?.prototype;

if (style) {
  const setProperty = style.setProperty;

  style.setProperty = function (...args: Parameters<CSSStyleDeclaration["setProperty"]>) {
    try {
      setProperty.apply(this, args);
    } catch {
      // Браузер здесь молчит — молчим и мы.
    }
  };
}

/**
 * Захват указателя — в JSDOM его нет вовсе, а `@kobalte/core` им пользуется.
 *
 * Ловится на уведомлении: обработчик `pointerup` спрашивает `hasPointerCapture`, получает
 * `undefined is not a function` и роняет прогон необработанной ошибкой — при том, что сам тест
 * зелёный. Заглушка отвечает «не захвачен» и ничего не делает: захват указателя это работа
 * браузера с настоящим вводом, и проверять его в JSDOM всё равно нечем.
 */
for (const name of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!(name in Element.prototype)) {
    Object.defineProperty(Element.prototype, name, {
      configurable: true,
      value: name === "hasPointerCapture" ? () => false : () => undefined,
    });
  }
}

/**
 * Заглушка загрузки картинок — JSDOM не грузит их вовсе, а `Image` на этом и держится.
 *
 * `@kobalte/core` заводит `new window.Image()`, ставит `src` и ждёт `onload`, чтобы показать
 * картинку вместо заглушки. В JSDOM события не будет никогда, то есть `image-img` не появился
 * бы в документе ни при каких условиях — и проверять его было бы нечем.
 *
 * Заглушка сообщает об успехе СЛЕДУЮЩЕЙ задачей, а не тем же тактом: так сохраняется настоящий
 * порядок «сначала заглушка, потом картинка», который и есть предмет проверки. Так же
 * поступает сам kobalte в своих тестах.
 */
class LoadedImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin: string | null = null;
  referrerPolicy = "";
  #src = "";

  get src(): string {
    return this.#src;
  }

  set src(value: string) {
    this.#src = value;
    setTimeout(() => this.onload?.(), 0);
  }
}

(globalThis as { Image?: unknown }).Image = LoadedImage;

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
 * Ждёт СЛЕДУЮЩЕЙ задачи цикла событий.
 *
 * Нужно там, где kobalte закрывает всплывающее не тем же тактом, что и выбор: обработчику
 * потребителя дают отработать до того, как узлы уедут из документа. Проверка без ожидания
 * прошла бы мимо предмета — утверждала бы, что меню не закрывается, хотя оно закрывается.
 * Микротаска (`await Promise.resolve()`) здесь не годится: закрытие приходит макрозадачей.
 */
export function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
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
