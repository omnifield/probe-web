// Поведение экрана утверждается ТЕСТОМ, а не скриншотом (`tasker:PROBEWEB-14`).
//
// Каждый блок ниже — это проверка ШВА, а не украшения: ломается зона — падает конкретный
// блок, и по нему видно, какая именно. Что именно ломается при каждой поломке, перечислено
// в `README.md` приложения.

import { afterEach, describe, expect, it, vi } from "vitest";

import { App, type Order } from "../src/app";
import { cleanup, mount, one, press, type } from "./dom";

afterEach(cleanup);

/** Отправка под контролем теста: промис разрешает сам тест, таймеров здесь нет. */
function controlledSend(): {
  send: (order: Order) => Promise<void>;
  taken: Order[];
  finish: () => void;
} {
  const taken: Order[] = [];
  let release = (): void => {};
  const send = (order: Order): Promise<void> => {
    taken.push(order);
    return new Promise<void>((resolve) => {
      release = resolve;
    });
  };
  return { send, taken, finish: () => release() };
}

describe("экран поднимается на всей цепочке", () => {
  it("рендерит форму и все зацепки, за которые цепляется CSS потребителя", () => {
    const host = mount(() => <App />);

    // Кит безголовый: единственное, что связывает разметку с оформлением, — эти атрибуты.
    // Пропадёт любой — страница осядет неодетой, и молча: типы про CSS ничего не знают.
    for (const slot of [
      "field",
      "label",
      "input",
      "textarea",
      "field-description",
      "button",
      "toggle",
      "separator",
      "select",
      "select-trigger",
    ]) {
      expect(host.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("не привозит ни одного класса от кита — оформляет только приложение", () => {
    const host = mount(() => <App />);

    // У кнопки класс есть, но он НАШ (`app-submit*`, собран `createStyle`), а у остальных
    // примитивов классов нет вовсе. Появится чужой — значит зона `ui` начала везти стили.
    expect(one(host, '[data-slot="input"]').getAttribute("class")).toBeNull();
    expect(one(host, '[data-slot="toggle"]').getAttribute("class")).toBeNull();
    expect(one(host, '[data-slot="button"]').getAttribute("class")).toBe(
      "app-submit app-submit--active",
    );
  });
});

describe("форма: ввод → изменение → реакция", () => {
  it("невалидный адрес показывает ошибку, валидный её убирает", () => {
    const host = mount(() => <App />);
    const input = one<HTMLInputElement>(host, '[data-slot="input"]');

    // Пустое поле не ругается: ошибка — реакция на ввод, а не приветствие.
    expect(host.querySelector('[data-slot="field-error"]')).toBeNull();

    type(input, "не почта");
    expect(one(host, '[data-slot="field-error"]').textContent).toBe("Не похоже на адрес");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    type(input, "me@example.com");
    expect(host.querySelector('[data-slot="field-error"]')).toBeNull();
    expect(input.getAttribute("aria-invalid")).toBeNull();
  });

  it("кнопка отправки открывается только на валидном адресе", () => {
    const host = mount(() => <App />);
    const button = one<HTMLButtonElement>(host, '[data-slot="button"]');

    expect(button.disabled).toBe(true);

    type(one<HTMLInputElement>(host, '[data-slot="input"]'), "me@example.com");
    expect(button.disabled).toBe(false);
  });

  it("подпись связана с вводом, а пояснение — описывает его", () => {
    // Ради этой связки поле и стоит на ките, а не на голом `<input>`: `for`↔`id` и
    // `aria-describedby` держатся на контексте `Field`.
    const host = mount(() => <App />);
    const input = one<HTMLInputElement>(host, '[data-slot="input"]');
    const label = one<HTMLLabelElement>(host, '[data-slot="label"]');
    const description = one(host, '[data-slot="field-description"]');

    expect(label.htmlFor).toBe(input.id);
    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });
});

describe("отправка", () => {
  it("на время ожидания кнопка занята, спиннер живой, класс пересчитан", async () => {
    const { send, taken, finish } = controlledSend();
    const host = mount(() => <App send={send} />);

    type(one<HTMLInputElement>(host, '[data-slot="input"]'), "me@example.com");
    type(one<HTMLTextAreaElement>(host, '[data-slot="textarea"]'), "срочно");

    const button = one<HTMLButtonElement>(host, '[data-slot="button"]');
    button.click();

    expect(taken).toEqual([{ mail: "me@example.com", city: null, comment: "срочно" }]);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.disabled).toBe(true);
    expect(one(host, '[data-slot="spinner"]').getAttribute("role")).toBe("status");
    // `createStyle` пересчитал вариант — реактивность стилевого слоя видна ровно здесь.
    expect(button.getAttribute("class")).toBe("app-submit app-submit--waiting");

    finish();
    await Promise.resolve();

    expect(button.getAttribute("aria-busy")).toBeNull();
    expect(host.querySelector('[data-slot="spinner"]')).toBeNull();
    expect(button.getAttribute("class")).toBe("app-submit app-submit--active");
    expect(one(host, ".app__done").textContent).toContain("me@example.com");
  });

  it("невалидную заявку не отправляет вовсе", () => {
    const send = vi.fn(() => Promise.resolve());
    const host = mount(() => <App send={send} />);

    type(one<HTMLInputElement>(host, '[data-slot="input"]'), "не почта");
    one<HTMLButtonElement>(host, '[data-slot="button"]').click();

    expect(send).not.toHaveBeenCalled();
  });
});

describe("тема — механика зоны `style` под кнопкой зоны `ui`", () => {
  it("переключает режим на документе и объявляет своё состояние атрибутом", () => {
    const host = mount(() => <App />);
    const toggle = one<HTMLButtonElement>(host, '[data-slot="toggle"]');

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(toggle.hasAttribute("data-pressed")).toBe(false);

    toggle.click();

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(toggle.hasAttribute("data-pressed")).toBe(true);
    expect(toggle.textContent).toBe("Тёмная");

    toggle.click();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(toggle.textContent).toBe("Светлая");
  });
});

describe("список городов", () => {
  it("панели до открытия нет, выбранный город доезжает до заявки", async () => {
    const { send, taken, finish } = controlledSend();
    const host = mount(() => <App send={send} />);

    expect(document.querySelector('[data-slot="select-content"]')).toBeNull();

    press(one(host, '[data-slot="select-trigger"]'));

    const items = document.querySelectorAll('[data-slot="select-item"]');
    expect(items.length).toBe(3);

    press(items[1]);

    expect(one(host, '[data-slot="select-value"]').textContent).toBe("Казань");

    type(one<HTMLInputElement>(host, '[data-slot="input"]'), "me@example.com");
    one<HTMLButtonElement>(host, '[data-slot="button"]').click();
    finish();
    await Promise.resolve();

    expect(taken[0]?.city).toBe("Казань");
  });
});
