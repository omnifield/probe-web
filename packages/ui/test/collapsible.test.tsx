// Пробы одиночной раскрывашки.
//
// Лежали в файле гармошки, пока обе стояли на `@kobalte/core`. Гармошка уехала на Ark и в свою
// папку (`PWEB-37`) — раскрывашка осталась там же, где была, и её пробы переехали сюда без
// правок по существу: их предмет не менялся.

import { afterEach, describe, expect, it } from "vitest";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../src/collapsible.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

describe("Collapsible", () => {
  it("раскрывается и закрывается, содержимое появляется и исчезает", () => {
    const host = mount(() => (
      <Collapsible>
        <CollapsibleTrigger>Подробнее</CollapsibleTrigger>
        <CollapsibleContent>Мелкий шрифт</CollapsibleContent>
      </Collapsible>
    ));

    expect(host.querySelector("[data-slot='collapsible-content']")).toBeNull();

    press(one(host, "[data-slot='collapsible-trigger']"));

    expect(one(host, "[data-slot='collapsible-content']").textContent).toBe("Мелкий шрифт");
    expect(one(host, "[data-slot='collapsible-trigger']").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("отдельный примитив, а не гармошка из одного раздела: ни заголовка, ни списка", () => {
    const host = mount(() => (
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Подробнее</CollapsibleTrigger>
        <CollapsibleContent>Мелкий шрифт</CollapsibleContent>
      </Collapsible>
    ));

    expect(host.querySelector("h3")).toBeNull();
    expect(host.querySelector("[data-scope='accordion']")).toBeNull();
  });
});
