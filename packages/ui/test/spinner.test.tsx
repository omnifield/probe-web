import { afterEach, describe, expect, it } from "vitest";

import { Spinner } from "../src/spinner.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("Spinner", () => {
  it("рендерит ОДИН узел `<span role=status>` — без внутренней разметки", () => {
    const host = mount(() => <Spinner aria-label="Загрузка" />);
    const node = one(host, "span");

    expect(host.children.length).toBe(1);
    // В оракуле узлов было два: внешний со `role` и внутренний с рамкой-кольцом. Кольца
    // здесь нет (это CSS потребителя), значит нет и второго узла.
    expect(node.children.length).toBe(0);
    expect(node.getAttribute("role")).toBe("status");
    expect(node.getAttribute("aria-label")).toBe("Загрузка");
  });

  it("не рисует ничего сам — ни класса, ни стиля", () => {
    const host = mount(() => <Spinner aria-label="Загрузка" />);
    const node = one(host, "span");

    expect(node.hasAttribute("class")).toBe(false);
    expect(node.hasAttribute("style")).toBe(false);
  });

  it("отдаёт содержимое как есть — подпись можно сделать видимой", () => {
    const host = mount(() => <Spinner>Загружаем отчёт…</Spinner>);

    expect(host.textContent).toBe("Загружаем отчёт…");
  });

  it("`role` потребителя перебивает дефолт", () => {
    const host = mount(() => <Spinner role="progressbar" aria-valuenow={40} />);

    expect(one(host, "span").getAttribute("role")).toBe("progressbar");
  });

  it("несёт зацепку `data-slot=spinner` — по ней потребитель и рисует", () => {
    const host = mount(() => <Spinner aria-label="Загрузка" />);

    expect(one(host, "span").getAttribute("data-slot")).toBe("spinner");
  });
});
