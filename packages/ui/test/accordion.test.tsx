import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../src/accordion.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Разделы справки — сборка, та же что в доке компонента. */
function Help(props: { value?: string[]; onChange?: (value: string[]) => void }) {
  return (
    <Accordion multiple value={props.value} onChange={props.onChange}>
      <AccordionItem value="доставка">
        <AccordionHeader>
          <AccordionTrigger>Доставка</AccordionTrigger>
        </AccordionHeader>
        <AccordionContent>Курьером и самовывозом</AccordionContent>
      </AccordionItem>
      <AccordionItem value="оплата">
        <AccordionHeader>
          <AccordionTrigger>Оплата</AccordionTrigger>
        </AccordionHeader>
        <AccordionContent>Картой и переводом</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("заголовок — настоящий `<h3>` вокруг кнопки, а не оформление кнопки", () => {
    // Без него раскрывашка выпадает из оглавления страницы: скринридер строит его по
    // заголовкам, а не по кнопкам.
    const host = mount(() => <Help value={[]} />);
    const header = one(host, "[data-slot='accordion-header']");

    expect(header.tagName).toBe("H3");
    expect(header.querySelector("[data-slot='accordion-trigger']")).not.toBeNull();
  });

  it("кнопка связана со своим содержимым и объявляет раскрытость", () => {
    const host = mount(() => <Help value={["доставка"]} />);
    const trigger = one(host, "[data-slot='accordion-trigger']");
    const content = one(host, "[data-slot='accordion-content']");

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(content.id);
    expect(trigger.hasAttribute("data-expanded")).toBe(true);
  });

  it("закрытый раздел из документа УДАЛЁН, а не спрятан", () => {
    // Важно оформлению: несуществующий узел нельзя ни анимировать, ни измерить. Нужен переход
    // при закрытии — `forceMount`, как и у панелей вкладок.
    const host = mount(() => <Help value={[]} />);

    expect(host.querySelectorAll("[data-slot='accordion-content']").length).toBe(0);
  });

  it("`multiple` держит открытыми несколько разделов", () => {
    const onChange = vi.fn();
    const host = mount(() => <Help value={["доставка"]} onChange={onChange} />);

    press(host.querySelectorAll("[data-slot='accordion-trigger']")[1]);

    expect(onChange).toHaveBeenCalledWith(["доставка", "оплата"]);
  });

  it("высоту отдаёт переменной CSS — анимацию пишет оформление", () => {
    const host = mount(() => <Help value={["доставка"]} />);

    expect(one(host, "[data-slot='accordion-content']").getAttribute("style")).toContain(
      "--kb-accordion-content-height",
    );
  });

  it("класса нет ни у одной части", () => {
    const host = mount(() => <Help value={["доставка"]} />);

    for (const node of host.querySelectorAll("[data-slot^='accordion']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });
});

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

  it("отдельный примитив, а не `Accordion` из одного раздела: ни заголовка, ни списка", () => {
    const host = mount(() => (
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Подробнее</CollapsibleTrigger>
        <CollapsibleContent>Мелкий шрифт</CollapsibleContent>
      </Collapsible>
    ));

    expect(host.querySelector("h3")).toBeNull();
    expect(host.querySelector("[data-slot='accordion-item']")).toBeNull();
  });
});
