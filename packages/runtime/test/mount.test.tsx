// Главный тест зоны: поднимает НАСТОЯЩЕЕ приложение на Solid в DOM и утверждает
// отрендеренный узел в `#root` (DoD задачи `tasker:PROBEWEB-11`). «Функция экспортируется» и
// «приложение поднялось» — разные утверждения, подтверждать надо второе.
//
// Сверка с рынком 2026-08-08: официальная утилита — `@solidjs/testing-library`
// (фонд `solid-testing-library`). НЕ берём: её `render` создаёт СВОЙ контейнер, а предмет
// проверки здесь ровно обратный — что рантайм находит точку монтирования сам, в документе.
// Прогон через неё обошёл бы контракт `#root`, то есть проверял бы не то. JSX-трансформ и
// условия разрешения берём из доки как предписано (`vite-plugin-solid`, см. vitest.config.ts).

import { createEffect, createSignal, onCleanup } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as runtime from "../src/index.js";
import { mount } from "../src/index.js";

const FLAG = "__PROBE_WEB_RUNTIME_TRACE__";

afterEach(() => {
  document.body.innerHTML = "";
  delete (globalThis as Record<string, unknown>)[FLAG];
  vi.restoreAllMocks();
});

/** Ставит в документ пустую точку монтирования — так её кладёт `index.html` потребителя. */
function givenRoot(): HTMLElement {
  document.body.innerHTML = '<div id="root"></div>';
  const host = document.getElementById("root");
  if (!host) throw new Error("не удалось подготовить #root");
  return host;
}

describe("поверхность", () => {
  it("наружу торчит ровно одна точка", () => {
    expect(Object.keys(runtime)).toEqual(["mount"]);
  });
});

describe("mount()", () => {
  it("поднимает приложение в #root, не спрашивая точку монтирования", () => {
    givenRoot();

    mount(() => <h1 data-testid="greeting">hello, probe-web</h1>);

    const node = document.querySelector<HTMLElement>('#root h1[data-testid="greeting"]');
    expect(node).not.toBeNull();
    expect(node?.textContent).toBe("hello, probe-web");
  });

  it("оставляет корень ЖИВЫМ — реактивность после монтирования работает", () => {
    givenRoot();
    const [count, setCount] = createSignal(0);

    mount(() => <span data-testid="count">{count()}</span>);
    expect(document.querySelector('#root [data-testid="count"]')?.textContent).toBe("0");

    setCount(1);
    expect(document.querySelector('#root [data-testid="count"]')?.textContent).toBe("1");
  });

  it("без #root падает с внятным сообщением, а не молча в пустую страницу", () => {
    document.body.innerHTML = "<div></div>";

    expect(() => mount(() => <p>всё равно не смонтируется</p>)).toThrow(/#root/);
    expect(document.body.textContent).toBe("");
  });
});

describe("владение и очистка", () => {
  it("повторное монтирование уничтожает прежний корень, а не кладёт второй сверху", () => {
    givenRoot();
    let disposed = 0;

    function First() {
      onCleanup(() => {
        disposed += 1;
      });
      return <p data-testid="first">первое</p>;
    }

    mount(() => <First />);
    expect(disposed).toBe(0);

    mount(() => <p data-testid="second">второе</p>);

    expect(disposed).toBe(1);
    expect(document.querySelector('#root [data-testid="first"]')).toBeNull();
    expect(document.querySelectorAll("#root > *")).toHaveLength(1);
    expect(document.querySelector('#root [data-testid="second"]')?.textContent).toBe("второе");
  });

  it("прежний корень уничтожается ВМЕСТЕ со своими вычислениями", () => {
    givenRoot();
    const [count, setCount] = createSignal(0);
    let runs = 0;

    function Old() {
      createEffect(() => {
        count();
        runs += 1;
      });
      return <span data-testid="old">{count()}</span>;
    }

    mount(() => <Old />);
    setCount(1);
    const runsBefore = runs;
    expect(runsBefore).toBeGreaterThan(0);

    mount(() => <span data-testid="new">новое</span>);
    setCount(2);

    // Отработавший корень на сигнал больше не реагирует: ни узла, ни эффекта. Без `dispose`
    // эффект прежнего корня остался бы подписан и счётчик здесь вырос бы.
    expect(document.querySelector('#root [data-testid="old"]')).toBeNull();
    expect(runs).toBe(runsBefore);
  });

  it("новый #root в документе — новое приложение, без обращения к мёртвому узлу", () => {
    givenRoot();
    mount(() => <p data-testid="first">первое</p>);

    // Разметку снесли целиком (навигация/перерисовка страницы) и положили новую точку.
    givenRoot();
    mount(() => <p data-testid="second">второе</p>);

    expect(document.querySelector('#root [data-testid="second"]')?.textContent).toBe("второе");
    expect(document.querySelectorAll("#root > *")).toHaveLength(1);
  });
});

describe("perf-трейсы", () => {
  it("по умолчанию молчат", () => {
    givenRoot();
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    mount(() => <p>тихо</p>);

    expect(debug).not.toHaveBeenCalled();
  });

  it("под глобальным флагом печатают длительность", () => {
    givenRoot();
    (globalThis as Record<string, unknown>)[FLAG] = true;
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    mount(() => <p>громко</p>);

    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug.mock.calls[0]?.[0]).toMatch(/\[probe-web-runtime] mount — [\d.]+ms/);
  });
});
