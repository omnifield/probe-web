import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchError,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
} from "../src/switch.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Полная сборка переключателя — та же, что стоит примером в доке компонента. */
function Theme(props: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Switch
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <SwitchInput />
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
      <SwitchLabel>Тёмная тема</SwitchLabel>
      <SwitchDescription>Переключится сразу</SwitchDescription>
      <SwitchError>Тема недоступна</SwitchError>
    </Switch>
  );
}

describe("Switch — каждая часть ОДИН узел своего тега", () => {
  it("корень рендерит один узел, части — свои", () => {
    const host = mount(() => <Theme />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("switch");
    expect(one(host, "[data-slot='switch-input']").tagName).toBe("INPUT");
    expect(one(host, "[data-slot='switch-control']").tagName).toBe("DIV");
    expect(one(host, "[data-slot='switch-thumb']").tagName).toBe("DIV");
    expect(one(host, "[data-slot='switch-label']").tagName).toBe("LABEL");
  });

  it("ввод объявлен переключателем, а не флажком", () => {
    // Разница между `Switch` и `Toggle` живёт именно здесь: у переключателя есть роль поля со
    // значением. Потеряется роль — вспомогательная техника прочитает настройку как флажок.
    const input = one<HTMLInputElement>(mount(() => <Theme />), "[data-slot='switch-input']");

    expect(input.getAttribute("role")).toBe("switch");
    expect(input.type).toBe("checkbox");
  });

  it("бегунок есть ВСЕГДА — он ездит, а не появляется", () => {
    // Отличие от отметки флажка, и оно намеренное: переход между положениями пишет
    // оформление, а для перехода узел обязан существовать в обоих состояниях.
    const [checked, setChecked] = createSignal(false);
    const host = mount(() => <Theme checked={checked()} />);

    expect(host.querySelector("[data-slot='switch-thumb']")).not.toBeNull();

    setChecked(true);

    expect(host.querySelector("[data-slot='switch-thumb']")).not.toBeNull();
  });

  it("подпись связана с вводом, пояснение уезжает в `aria-describedby`", () => {
    const host = mount(() => <Theme />);

    const input = one<HTMLInputElement>(host, "[data-slot='switch-input']");
    expect(one<HTMLLabelElement>(host, "[data-slot='switch-label']").htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toContain(
      one(host, "[data-slot='switch-description']").id,
    );
  });
});

describe("Switch — состояние", () => {
  it("состояние приезжает атрибутами данных на дорожку и бегунок", () => {
    const host = mount(() => <Theme checked />);

    expect(one(host, "[data-slot='switch-control']").hasAttribute("data-checked")).toBe(true);
    expect(one(host, "[data-slot='switch-thumb']").hasAttribute("data-checked")).toBe(true);
  });

  it("неуправляемый режим: клик переключает и зовёт `onChange`", () => {
    const onChange = vi.fn();
    const host = mount(() => <Theme onChange={onChange} />);

    one<HTMLInputElement>(host, "[data-slot='switch-input']").click();

    expect(onChange).toHaveBeenCalledWith(true);
    expect(one(host, "[data-slot='switch-control']").hasAttribute("data-checked")).toBe(true);
  });

  it("управляемый режим: состояние держит потребитель", () => {
    const [checked, setChecked] = createSignal(true);
    const host = mount(() => <Theme checked={checked()} />);
    const control = one(host, "[data-slot='switch-control']");

    expect(control.hasAttribute("data-checked")).toBe(true);

    setChecked(false);

    expect(control.hasAttribute("data-checked")).toBe(false);
  });

  it("отключённый переключатель не меняет состояние", () => {
    const onChange = vi.fn();
    const host = mount(() => <Theme disabled onChange={onChange} />);

    one<HTMLInputElement>(host, "[data-slot='switch-input']").click();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Theme invalid={invalid()} />);

    expect(host.querySelector("[data-slot='switch-error']")).toBeNull();

    setInvalid(true);

    expect(one(host, "[data-slot='switch-error']").textContent).toBe("Тема недоступна");
  });
});

describe("Switch — стилей по умолчанию нет, кроме названного отступления", () => {
  it("ни одна часть не приносит класса, а стиль — только у спрятанного ввода", () => {
    const host = mount(() => <Theme checked invalid />);

    for (const node of host.querySelectorAll("[data-slot^='switch']")) {
      expect(node.hasAttribute("class")).toBe(false);

      if (node.getAttribute("data-slot") !== "switch-input") {
        expect(node.hasAttribute("style")).toBe(false);
      }
    }
  });

  it("спрятанный ввод унесён из вида, а не оформлен", () => {
    // То же отступление, что у флажка, и по той же причине: настоящий ввод остаётся ради
    // фокуса и формы, а видно дорожку с бегунком. Разбор — в `test/checkbox.test.tsx`.
    const style = one(mount(() => <Theme />), "[data-slot='switch-input']").getAttribute("style");

    expect(style).toContain("position: absolute");
    expect(style).not.toMatch(/color|background|font|radius/);
  });
});
