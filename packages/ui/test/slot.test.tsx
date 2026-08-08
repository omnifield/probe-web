import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Slot } from "../src/slot.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

describe("Slot", () => {
  it("по умолчанию рендерит ОДИН div и ничего вокруг", () => {
    const host = mount(() => <Slot>содержимое</Slot>);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.tagName).toBe("DIV");
    expect(host.firstElementChild?.children.length).toBe(0);
    expect(host.textContent).toBe("содержимое");
  });

  it("рендерит тег из `as` — и по-прежнему ровно один узел", () => {
    const host = mount(() => (
      <Slot as="a" href="/docs">
        документация
      </Slot>
    ));

    expect(host.children.length).toBe(1);
    expect(one<HTMLAnchorElement>(host, "a").getAttribute("href")).toBe("/docs");
  });

  it("рендерит компонент из `as`, донося до него пропсы", () => {
    const Custom = (props: { title?: string; children?: unknown }) => (
      <section title={props.title}>{props.children as never}</section>
    );

    const host = mount(() => (
      <Slot as={Custom} title="свой компонент">
        внутри
      </Slot>
    ));

    expect(one(host, "section").getAttribute("title")).toBe("свой компонент");
    expect(host.textContent).toBe("внутри");
  });

  it("держит реактивность пропса — узел обновляется, а не застывает", () => {
    const [label, setLabel] = createSignal("до");
    const host = mount(() => <Slot aria-label={label()} />);

    expect(one(host, "div").getAttribute("aria-label")).toBe("до");

    setLabel("после");

    // Если бы обёртка деструктурировала `props`, здесь осталось бы «до» — и молча.
    expect(one(host, "div").getAttribute("aria-label")).toBe("после");
  });

  it("`as` потребителя перебивает дефолт, а не наоборот", () => {
    const host = mount(() => <Slot as="span" />);

    expect(host.firstElementChild?.tagName).toBe("SPAN");
  });
});
