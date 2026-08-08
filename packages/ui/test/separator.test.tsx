import { afterEach, describe, expect, it } from "vitest";

import { Separator } from "../src/separator.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("Separator", () => {
  it("рендерит ОДИН узел `<hr>`", () => {
    const host = mount(() => <Separator />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("HR");
  });

  it("горизонтальный не объявляет ориентацию — она у роли подразумевается", () => {
    const host = mount(() => <Separator />);
    const node = one(host, "hr");

    expect(node.getAttribute("data-orientation")).toBe("horizontal");
    // Лишний `aria-orientation="horizontal"` — шум: скринридер и так знает дефолт роли.
    expect(node.hasAttribute("aria-orientation")).toBe(false);
  });

  it("вертикальный объявляет ориентацию явно", () => {
    const host = mount(() => <Separator orientation="vertical" />);
    const node = one(host, "hr");

    expect(node.getAttribute("aria-orientation")).toBe("vertical");
    expect(node.getAttribute("data-orientation")).toBe("vertical");
  });

  it("декоративный разделитель собирается пропсами потребителя", () => {
    // Пропа `decorative` у примитива нет намеренно (см. доку компонента): роль ставится
    // насквозь, и ветки внутри примитива для этого не нужно.
    const host = mount(() => <Separator as="div" role="none" />);
    const node = one(host, "div");

    expect(node.getAttribute("role")).toBe("none");
  });

  it("несёт зацепку `data-slot=separator` по умолчанию", () => {
    const host = mount(() => <Separator />);

    expect(one(host, "hr").getAttribute("data-slot")).toBe("separator");
  });
});
