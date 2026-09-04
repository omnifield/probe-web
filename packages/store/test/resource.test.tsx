// Регрессия на баг апстрима, разобранный в `src/resource.ts`: `createAsyncAtom` из
// `@xstate/store` перестаёт реагировать на смену входа после первого резолва (проверено прямым
// прогоном на голом пакете, без Solid, 2026-09-04). Эти тесты держат ОБА кейса заявки —
// синхронный (`componentsAtom`) и асинхронный по ключу (`componentInfo`) — одним и тем же
// приёмом (`createResourceAtom`), включая повторную смену ключа, которую апстримный примитив
// проваливал.
import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { createResourceAtom } from "../src/resource.js";
import { useAtom } from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("createResourceAtom — без ключа (кейс componentsAtom)", () => {
  it("синхронный фетчер даёт status: done сразу, без промежуточного pending в снимке", () => {
    const atom = createResourceAtom(() => [1, 2, 3]);
    expect(atom.get()).toEqual({ status: "done", data: [1, 2, 3] });
  });
});

describe("createResourceAtom — по ключу (кейс componentInfo)", () => {
  it("реагирует на смену ключа ПОСЛЕ того, как первый запрос уже резолвнулся", async () => {
    const [id, setId] = createSignal(1);
    let calls = 0;
    const atom = createResourceAtom(id, async (key) => {
      calls++;
      await Promise.resolve();
      return { id: key, call: calls };
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(atom.get()).toEqual({ status: "done", data: { id: 1, call: 1 } });

    setId(2);
    await new Promise((r) => setTimeout(r, 0));
    expect(atom.get()).toEqual({ status: "done", data: { id: 2, call: 2 } });
    expect(calls).toBe(2);
  });

  it("игнорирует устаревший ответ, если ключ поменялся до резолва предыдущего", async () => {
    const [id, setId] = createSignal(1);
    const atom = createResourceAtom(id, async (key) => {
      const delay = key === 1 ? 20 : 0;
      await new Promise((r) => setTimeout(r, delay));
      return key;
    });

    setId(2); // до резолва id=1
    await new Promise((r) => setTimeout(r, 40));
    expect(atom.get()).toEqual({ status: "done", data: 2 });
  });

  it("через useAtom/useSelector отдаёт то же состояние живому компоненту", async () => {
    const [id, setId] = createSignal(1);
    const atom = createResourceAtom(id, async (key) => {
      await Promise.resolve();
      return `component-${key}`;
    });

    function Info() {
      const state = useAtom(atom);
      return (
        <p>
          {(() => {
            const snapshot = state();
            return snapshot.status === "done" ? snapshot.data : snapshot.status;
          })()}
        </p>
      );
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Info />, host);

    expect(host.textContent).toBe("pending");
    await new Promise((r) => setTimeout(r, 0));
    expect(host.textContent).toBe("component-1");

    setId(2);
    await new Promise((r) => setTimeout(r, 0));
    expect(host.textContent).toBe("component-2");
  });
});
