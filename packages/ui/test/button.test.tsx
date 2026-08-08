import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../src/button.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("Button", () => {
  it("рендерит ОДИН узел `<button>` и ничего вокруг", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("BUTTON");
    expect(host.textContent).toBe("Сохранить");
  });

  it("ставит `type=button` — кнопка в форме не отправляет её нажатием", () => {
    const host = mount(() => <Button>Показать</Button>);

    expect(one<HTMLButtonElement>(host, "button").type).toBe("button");
  });

  it("`type` потребителя выигрывает — кнопку отправки собрать можно", () => {
    const host = mount(() => <Button type="submit">Отправить</Button>);

    expect(one<HTMLButtonElement>(host, "button").type).toBe("submit");
  });

  it("отключённая кнопка несёт и нативный `disabled`, и `data-disabled`", () => {
    const host = mount(() => <Button disabled>Нельзя</Button>);
    const node = one<HTMLButtonElement>(host, "button");

    expect(node.disabled).toBe(true);
    // `data-disabled` — зацепка для CSS: у отключённой кнопки нет ни `:hover`, ни своего
    // класса, и без атрибута состояние снаружи не видно.
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("отключённая кнопка не зовёт обработчик", () => {
    const onClick = vi.fn();
    const host = mount(() => (
      <Button disabled onClick={onClick}>
        Нельзя
      </Button>
    ));

    one<HTMLButtonElement>(host, "button").click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("при `as='a'` остаётся ссылкой — без подмены роли", () => {
    const host = mount(() => (
      <Button as="a" href="/docs">
        Документация
      </Button>
    ));
    const node = one<HTMLAnchorElement>(host, "a");

    expect(host.children.length).toBe(1);
    expect(node.getAttribute("href")).toBe("/docs");
    // У `<a href>` роль ссылки уже есть; `role="button"` тут был бы враньём скринридеру.
    expect(node.hasAttribute("role")).toBe(false);
    expect(node.hasAttribute("type")).toBe(false);
  });

  it("при `as='div'` дописывает роль и фокусируемость, которых у div нет", () => {
    const host = mount(() => <Button as="div">Псевдокнопка</Button>);
    const node = one(host, "div");

    expect(node.getAttribute("role")).toBe("button");
    expect(node.getAttribute("tabindex")).toBe("0");
  });

  it("отключённая НЕнативная кнопка объявляет это через `aria-disabled`", () => {
    const host = mount(() => (
      <Button as="div" disabled>
        Нельзя
      </Button>
    ));
    const node = one(host, "div");

    // У `<div>` нет атрибута `disabled` — без `aria-disabled` состояние не озвучивается.
    expect(node.getAttribute("aria-disabled")).toBe("true");
    expect(node.hasAttribute("data-disabled")).toBe(true);
  });

  it("несёт зацепку `data-slot=button` по умолчанию", () => {
    const host = mount(() => <Button>Ок</Button>);

    expect(one(host, "button").getAttribute("data-slot")).toBe("button");
  });

  it("состояние загрузки собирается из готового, без пропа-сахара", () => {
    // Проверяем ровно то, что обещано в доке компонента: сборка из `disabled` + `aria-busy`
    // + вложенного индикатора даёт то же, ради чего в оракуле был проп `loading`.
    const host = mount(() => (
      <Button disabled aria-busy="true">
        <span data-testid="индикатор" />
      </Button>
    ));
    const node = one<HTMLButtonElement>(host, "button");

    expect(node.disabled).toBe(true);
    expect(node.getAttribute("aria-busy")).toBe("true");
    expect(node.querySelector('[data-testid="индикатор"]')).not.toBeNull();
  });
});
