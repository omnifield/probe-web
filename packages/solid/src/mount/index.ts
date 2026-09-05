// Точка 1 замороженной поверхности — mountApp()/#root. Контракт и обоснования — README.md/FAQ.md.
// Собственное добавление пакета, не реэкспорт solid-js — свой подпуть, не в барели `.`/`./web`.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

/** Идентификатор точки монтирования — часть замороженной поверхности, см. FAQ.md. */
const ROOT_ID = "root";

/** Узел-хозяин → `dispose` его корня. `WeakMap`, не модульная переменная — см. FAQ.md. */
const mounted = new WeakMap<Element, () => void>();

/**
 * Монтирует Solid-приложение в документ — точку `#root` ищет сама. Обоснования решений —
 * README.md/FAQ.md пакета.
 *
 * @param root корневой компонент приложения
 * @throws если в документе нет `#root`
 */
export function mountApp(root: () => JSX.Element): void {
  const host = document.getElementById(ROOT_ID);
  if (!host) {
    throw new Error(
      `[web-core-solid] mountApp(): в документе нет элемента #${ROOT_ID}. ` +
        `Точку монтирования рантайм ищет сам — добавь в index.html <div id="${ROOT_ID}"></div>.`,
    );
  }

  mounted.get(host)?.();
  mounted.set(host, render(root, host));
}
