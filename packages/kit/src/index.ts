// Точка 1 замороженной поверхности — РАНТАЙМ (`kb:PROBEWEB-2`).
//
// Скелет едет к потребителю классом `placed-once`: положен один раз и НИКОГДА не
// обновляется. Значит вызов `mount()` в его `main.tsx` живёт вечно ровно в той форме, в
// какой его туда положили. Менять сигнатуру нельзя без мажора и разговора с architect.

import type { JSX } from "solid-js";
import { render } from "solid-js/web";

import { trace } from "./trace.js";

/**
 * Идентификатор точки монтирования. Часть ЗАМОРОЖЕННОЙ поверхности наравне с тремя
 * экспортами: он живёт в `index.html` потребителя, а тот — `placed-once`.
 */
const ROOT_ID = "root";

/**
 * Монтирует Solid-приложение в документ.
 *
 * Точку монтирования kit ищет САМ — элемент `#root`. В сигнатуре её нет намеренно: иначе
 * заморозился бы заодно способ разметки страницы, а он обязан двигаться, когда сюда
 * приедет настоящая заготовка фронта.
 *
 * @param root корневой компонент приложения
 * @throws если в документе нет `#root` — падаем внятно, а не молча в пустую страницу
 */
export function mount(root: () => JSX.Element): void {
  const done = trace("mount");

  const host = document.getElementById(ROOT_ID);
  if (!host) {
    throw new Error(
      `[probe-web-kit] mount(): в документе нет элемента #${ROOT_ID}. ` +
        `Точку монтирования kit ищет сам — добавь в index.html <div id="${ROOT_ID}"></div>.`,
    );
  }

  render(root, host);
  done();
}
