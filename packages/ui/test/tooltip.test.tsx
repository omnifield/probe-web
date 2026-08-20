import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../src/button/index.js";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "../src/tooltip.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Полная сборка подсказки — та же, что стоит примером в доке компонента. */
function Hint(props: { open?: boolean }) {
  return (
    <Tooltip open={props.open}>
      <TooltipTrigger>Сохранить</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>
          <TooltipArrow />
          Ctrl+S
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}

describe("Tooltip — узлы", () => {
  it("корень своего узла НЕ рендерит — зацепки `tooltip` нет намеренно", () => {
    const host = mount(() => <Hint />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("tooltip-trigger");
    expect(host.querySelector("[data-slot='tooltip']")).toBeNull();
  });

  it("подсказки в документе нет, пока она не открыта", () => {
    mount(() => <Hint />);

    expect(document.querySelector("[data-slot='tooltip-content']")).toBeNull();
  });

  it("открытая подсказка объявлена ролью и связана с элементом", () => {
    const host = mount(() => <Hint open />);

    const content = one(document, "[data-slot='tooltip-content']");
    const trigger = one(host, "[data-slot='tooltip-trigger']");

    // Связь важнее вида: без `aria-describedby` подсказку прочитает только зрячий.
    expect(content.getAttribute("role")).toBe("tooltip");
    expect(trigger.getAttribute("aria-describedby")).toContain(content.id);
  });

  it("управляемая открытость приходит снаружи", () => {
    const [open, setOpen] = createSignal(false);
    mount(() => <Hint open={open()} />);

    expect(document.querySelector("[data-slot='tooltip-content']")).toBeNull();

    setOpen(true);

    expect(one(document, "[data-slot='tooltip-content']").textContent).toContain("Ctrl+S");
  });

  it("`as` надевает подсказку на СУЩЕСТВУЮЩУЮ кнопку, не добавляя узла", () => {
    // Обёртка вокруг чужого элемента была бы лишним узлом в разметке и лишней целью для
    // оформления. Здесь узел один, и он несёт обе зацепки сразу.
    const host = mount(() => (
      <Tooltip open>
        <TooltipTrigger as={Button}>Сохранить</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>Ctrl+S</TooltipContent>
        </TooltipPortal>
      </Tooltip>
    ));

    expect(host.children.length).toBe(1);
    // `data-slot` кнопки перебит зацепкой подсказки — она стоит последней в цепочке спреда.
    // Важно, что узел ОДИН, а не два вложенных.
    expect(host.firstElementChild?.tagName).toBe("BUTTON");
    expect(host.querySelectorAll("button").length).toBe(1);
  });
});

describe("Tooltip — те же отступления, что у панели", () => {
  it("подсказка приезжает внутри позиционера", () => {
    mount(() => <Hint open />);

    const content = one(document, "[data-slot='tooltip-content']");

    expect(content.parentElement?.hasAttribute("data-popper-positioner")).toBe(true);
    expect(content.parentElement?.children.length).toBe(1);
  });

  it("стрелка — вектор внутри и стиль позиционирования, класса нет", () => {
    mount(() => <Hint open />);

    const arrow = one(document, "[data-slot='tooltip-arrow']");

    expect(arrow.querySelector("svg")).not.toBeNull();
    expect(arrow.getAttribute("style")).toContain("position: absolute");
    expect(arrow.hasAttribute("class")).toBe(false);
  });

  it("ни одна часть не приносит своего класса", () => {
    mount(() => <Hint open />);

    for (const node of document.querySelectorAll("[data-slot^='tooltip']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });
});
