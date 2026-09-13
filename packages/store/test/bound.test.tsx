import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { createBoundAtom } from "../src/engine/bound.js";
import { useAtom } from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("createBoundAtom (кейс currentComponent/currentOutfit)", () => {
  it("берёт начальное значение из аксессора сразу, без отдельного pending-состояния", () => {
    const [component] = createSignal("button");
    const atom = createBoundAtom(component);
    expect(atom.get()).toBe("button");
  });

  it("следует за сменой аксессора", () => {
    const [component, setComponent] = createSignal("button");
    const atom = createBoundAtom(component);

    setComponent("field");
    expect(atom.get()).toBe("field");
  });

  it("через useAtom отдаёт то же значение живому компоненту", () => {
    const [outfit, setOutfit] = createSignal<string | undefined>(undefined);

    function Label() {
      const value = useAtom(createBoundAtom(outfit));
      return <p>{value() ?? "none"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Label />, host);

    expect(host.textContent).toBe("none");
    setOutfit("dark");
    expect(host.textContent).toBe("dark");
  });

  it("атом остаётся писуемым напрямую через .set(), не только через аксессор", () => {
    const [component] = createSignal("button");
    const atom = createBoundAtom(component);

    atom.set("field");
    expect(atom.get()).toBe("field");
  });
});
