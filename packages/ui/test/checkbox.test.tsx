import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Checkbox,
  CheckboxControl,
  CheckboxDescription,
  CheckboxError,
  CheckboxIndicator,
  CheckboxInput,
  CheckboxLabel,
} from "../src/checkbox.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Полная сборка флажка — та же, что стоит примером в доке компонента. */
function Agreement(props: {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Checkbox
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
      validationState={props.invalid ? "invalid" : "valid"}
    >
      <CheckboxInput />
      <CheckboxControl>
        <CheckboxIndicator>✓</CheckboxIndicator>
      </CheckboxControl>
      <CheckboxLabel>Согласен</CheckboxLabel>
      <CheckboxDescription>Условия обслуживания</CheckboxDescription>
      <CheckboxError>Без согласия нельзя</CheckboxError>
    </Checkbox>
  );
}

describe("Checkbox — каждая часть ОДИН узел своего тега", () => {
  it("корень рендерит один узел, части — свои", () => {
    const host = mount(() => <Agreement />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("checkbox");
    expect(one(host, "[data-slot='checkbox-input']").tagName).toBe("INPUT");
    expect(one(host, "[data-slot='checkbox-control']").tagName).toBe("DIV");
    expect(one(host, "[data-slot='checkbox-label']").tagName).toBe("LABEL");
  });

  it("ввод НАСТОЯЩИЙ — `input[type=checkbox]`, а не `div` с ролью", () => {
    // Это и есть причина, по которой часть `checkbox-input` существует отдельно: фокус,
    // участие в форме и доступность несёт нативный элемент, а рисуют соседний узел.
    const input = one<HTMLInputElement>(mount(() => <Agreement />), "[data-slot='checkbox-input']");

    expect(input.type).toBe("checkbox");
  });

  it("подпись связана с вводом — `for` совпадает с `id`", () => {
    const host = mount(() => <Agreement />);

    const label = one<HTMLLabelElement>(host, "[data-slot='checkbox-label']");
    const input = one<HTMLInputElement>(host, "[data-slot='checkbox-input']");

    expect(label.htmlFor).toBe(input.id);
    expect(input.id).not.toBe("");
  });

  it("пояснение уезжает в `aria-describedby` ввода", () => {
    const host = mount(() => <Agreement />);

    const description = one(host, "[data-slot='checkbox-description']");
    const input = one(host, "[data-slot='checkbox-input']");

    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });
});

describe("Checkbox — состояние", () => {
  it("отметка рендерится ТОЛЬКО во включённом состоянии", () => {
    const [checked, setChecked] = createSignal(false);
    const host = mount(() => <Agreement checked={checked()} onChange={setChecked} />);

    expect(host.querySelector("[data-slot='checkbox-indicator']")).toBeNull();

    setChecked(true);

    expect(one(host, "[data-slot='checkbox-indicator']").textContent).toBe("✓");
  });

  it("состояние приезжает атрибутами данных — по ним и рисуют", () => {
    const host = mount(() => <Agreement checked />);

    // Оформлению нужен не класс, а состояние на узле, который видно.
    expect(one(host, "[data-slot='checkbox-control']").hasAttribute("data-checked")).toBe(true);
  });

  it("неуправляемый режим: клик по вводу переключает и зовёт `onChange`", () => {
    const onChange = vi.fn();
    const host = mount(() => <Agreement onChange={onChange} />);
    const input = one<HTMLInputElement>(host, "[data-slot='checkbox-input']");

    input.click();

    expect(onChange).toHaveBeenCalledWith(true);
    expect(one(host, "[data-slot='checkbox-control']").hasAttribute("data-checked")).toBe(true);
  });

  it("управляемый режим: состояние держит потребитель", () => {
    const [checked, setChecked] = createSignal(true);
    const host = mount(() => <Agreement checked={checked()} />);
    const control = one(host, "[data-slot='checkbox-control']");

    expect(control.hasAttribute("data-checked")).toBe(true);

    setChecked(false);

    // Значение приехало снаружи — узел идёт за ним, а не за своим прошлым кликом.
    expect(control.hasAttribute("data-checked")).toBe(false);
  });

  it("отключённый флажок не переключается", () => {
    const onChange = vi.fn();
    const host = mount(() => <Agreement disabled onChange={onChange} />);

    one<HTMLInputElement>(host, "[data-slot='checkbox-input']").click();

    expect(onChange).not.toHaveBeenCalled();
  });

  it("сообщение об ошибке — только при `validationState=invalid`", () => {
    const [invalid, setInvalid] = createSignal(false);
    const host = mount(() => <Agreement invalid={invalid()} />);

    expect(host.querySelector("[data-slot='checkbox-error']")).toBeNull();

    setInvalid(true);

    const error = one(host, "[data-slot='checkbox-error']");
    expect(error.textContent).toBe("Без согласия нельзя");
    expect(one(host, "[data-slot='checkbox-input']").getAttribute("aria-describedby")).toContain(
      error.id,
    );
  });
});

describe("Checkbox — стилей по умолчанию нет, и одно названное исключение", () => {
  it("ни одна часть не приносит класса, а стиль — только у спрятанного ввода", () => {
    const host = mount(() => <Agreement checked invalid />);

    for (const node of host.querySelectorAll("[data-slot^='checkbox']")) {
      expect(node.hasAttribute("class")).toBe(false);

      // Единственный узел со стилем — настоящий ввод, и стиль на нём НЕ презентационный:
      // это `visuallyHiddenStyles` самого kobalte (см. отступление ниже).
      if (node.getAttribute("data-slot") !== "checkbox-input") {
        expect(node.hasAttribute("style")).toBe(false);
      }
    }
  });

  it("спрятанный ввод унесён из вида, а не оформлен", () => {
    // НАЗВАННОЕ ОТСТУПЛЕНИЕ от «ноль стилей по умолчанию», второе и последнее в зоне.
    // Стиль ставит `@kobalte/core` (`visuallyHiddenStyles` из `@kobalte/utils`), и он не про
    // вид, а про механику доступности: настоящий `<input>` обязан остаться в документе ради
    // фокуса, формы и скринридера, но не должен быть виден — рисуют соседний `checkbox-control`.
    // Убрать его нельзя обёрткой и не нужно: снять ввод из вида CSS-ом потребителя означало бы,
    // что каждый потребитель обязан это правило написать, иначе получит двойной флажок.
    const input = one(mount(() => <Agreement />), "[data-slot='checkbox-input']");
    const style = input.getAttribute("style") ?? "";

    expect(style).toContain("position: absolute");
    expect(style).toContain("width: 1px");
    // Ни одного решения про ВИД: ни цвета, ни шрифта, ни скругления.
    expect(style).not.toMatch(/color|background|font|radius/);
  });

  it("стиль потребителя доезжает и не затирается спрятанностью", () => {
    // Обратная сторона отступления: если бы kobalte ставил свой стиль ПОВЕРХ, потребитель
    // потерял бы возможность подвинуть ввод — а он ему нужен, например, ради `:focus-visible`
    // у рамки. `combineStyle` сливает оба, и это надо держать проверкой, а не верой.
    const host = mount(() => (
      <Checkbox>
        <CheckboxInput style={{ "z-index": "3" }} />
      </Checkbox>
    ));

    const style = one(host, "[data-slot='checkbox-input']").getAttribute("style") ?? "";

    expect(style).toContain("z-index: 3");
    expect(style).toContain("position: absolute");
  });
});
