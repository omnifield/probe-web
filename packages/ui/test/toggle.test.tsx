import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toggle } from "../src/toggle.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("Toggle", () => {
  it("рендерит ОДИН узел `<button>` — без обёртки и без подписи внутри", () => {
    const host = mount(() => <Toggle>Ж</Toggle>);

    // В оракуле здесь было три узла: div > (button + label). Тест и держит границу.
    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("BUTTON");
    expect(host.querySelector("label")).toBeNull();
  });

  it("объявляет состояние через `aria-pressed`", () => {
    const host = mount(() => <Toggle aria-label="Полужирный" />);

    expect(one(host, "button").getAttribute("aria-pressed")).toBe("false");
  });

  it("неуправляемый режим: нажатие переключает и ставит `data-pressed`", () => {
    const host = mount(() => <Toggle aria-label="Полужирный" />);
    const node = one<HTMLButtonElement>(host, "button");

    node.click();

    expect(node.getAttribute("aria-pressed")).toBe("true");
    expect(node.hasAttribute("data-pressed")).toBe(true);
  });

  it("неуправляемый режим стартует с `defaultPressed`", () => {
    const host = mount(() => <Toggle defaultPressed aria-label="Полужирный" />);

    expect(one(host, "button").getAttribute("aria-pressed")).toBe("true");
  });

  it("управляемый режим: состояние держит потребитель, а не примитив", () => {
    const [pressed, setPressed] = createSignal(false);
    const host = mount(() => (
      <Toggle pressed={pressed()} onChange={setPressed} aria-label="Полужирный" />
    ));
    const node = one<HTMLButtonElement>(host, "button");

    node.click();
    expect(node.getAttribute("aria-pressed")).toBe("true");

    setPressed(false);
    // Значение приехало снаружи — узел обязан пойти за ним, а не за своим прошлым кликом.
    expect(node.getAttribute("aria-pressed")).toBe("false");
  });

  it("зовёт `onChange` с новым состоянием", () => {
    const onChange = vi.fn();
    const host = mount(() => <Toggle onChange={onChange} aria-label="Полужирный" />);

    one<HTMLButtonElement>(host, "button").click();

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("отключённый переключатель не меняет состояние", () => {
    const onChange = vi.fn();
    const host = mount(() => <Toggle disabled onChange={onChange} aria-label="Полужирный" />);
    const node = one<HTMLButtonElement>(host, "button");

    node.click();

    expect(onChange).not.toHaveBeenCalled();
    expect(node.getAttribute("aria-pressed")).toBe("false");
  });

  it("несёт зацепку `data-slot=toggle` по умолчанию", () => {
    const host = mount(() => <Toggle aria-label="Полужирный" />);

    expect(one(host, "button").getAttribute("data-slot")).toBe("toggle");
  });
});
