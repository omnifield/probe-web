// Смоук-проба зоны: настоящий рендер обоих слоёв, а не разбор опций — то, что действительно
// ловит сломанный реэкспорт или разъехавшийся вендор.
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createStore, useSelector } from "../src/index.js";
import { createMachine, useMachine } from "../src/machine.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("@omnifield/probe-web-store — слой ./ (createStore)", () => {
  it("useSelector отдаёт аксессор и реагирует на send", () => {
    const store = createStore({
      context: { count: 0 },
      on: {
        inc: (context, event: { by: number }) => ({ count: context.count + event.by }),
      },
    });

    function Counter() {
      const count = useSelector(store, (state) => state.context.count);
      return <p>{count()}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Counter />, host);

    expect(host.textContent).toBe("0");
    store.trigger.inc({ by: 5 });
    expect(host.textContent).toBe("5");
  });
});

describe("@omnifield/probe-web-store — слой ./machine (xstate)", () => {
  it("useMachine отдаёт реактивный СНАПШОТ (не аксессор) и send переводит состояние", () => {
    const toggleMachine = createMachine({
      id: "toggle",
      initial: "inactive",
      states: {
        inactive: { on: { TOGGLE: "active" } },
        active: { on: { TOGGLE: "inactive" } },
      },
    });

    function Toggle() {
      const [state, send] = useMachine(toggleMachine);
      return (
        <button type="button" onClick={() => send({ type: "TOGGLE" })}>
          {state.value as string}
        </button>
      );
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Toggle />, host);

    const button = host.querySelector("button")!;
    expect(button.textContent).toBe("inactive");
    button.click();
    expect(button.textContent).toBe("active");
  });
});
