import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectListbox,
  SelectPortal,
  SelectTrigger,
  SelectValue,
} from "../src/select.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const CITIES = ["Москва", "Казань", "Пермь"];

/**
 * Полная сборка списка — та самая, что стоит примером в доке компонента.
 *
 * Собирает её ТЕСТ, а не примитив: в этом и разница с оракулом, где триггер, иконку, портал
 * и галочку рисовал сам корень. Здесь корень не знает, какая у панели разметка.
 */
function City(props: {
  value?: string;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <Select<string>
      options={CITIES}
      placeholder="Город"
      value={props.value}
      onChange={props.onChange}
      disabled={props.disabled}
      itemComponent={(item) => (
        <SelectItem item={item.item}>
          <SelectItemLabel>{item.item.rawValue}</SelectItemLabel>
          <SelectItemIndicator>✓</SelectItemIndicator>
        </SelectItem>
      )}
    >
      <SelectTrigger>
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
        <SelectIcon>▾</SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <SelectListbox />
        </SelectContent>
      </SelectPortal>
    </Select>
  );
}

describe("Select — закрытое состояние", () => {
  it("корень рендерит ОДИН узел, панели в документе нет", () => {
    const host = mount(() => <City />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("select");
    // Панель живёт в портале и до открытия не существует вовсе.
    expect(document.querySelector("[data-slot='select-content']")).toBeNull();
  });

  it("триггер — один `<button>`, объявляющий всплывающий список", () => {
    const host = mount(() => <City />);
    const trigger = one<HTMLButtonElement>(host, "[data-slot='select-trigger']");

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("показывает подпись-заполнитель, пока ничего не выбрано", () => {
    const host = mount(() => <City />);

    expect(one(host, "[data-slot='select-value']").textContent).toBe("Город");
  });

  it("показывает выбранное значение в управляемом режиме", () => {
    const host = mount(() => <City value="Казань" />);

    expect(one(host, "[data-slot='select-value']").textContent).toBe("Казань");
  });
});

describe("Select — открытие и выбор", () => {
  it("нажатие на триггер открывает панель со списком вариантов", () => {
    const host = mount(() => <City />);
    press(one(host, "[data-slot='select-trigger']"));

    const listbox = one(document, "[data-slot='select-listbox']");
    expect(listbox.tagName).toBe("UL");
    expect(listbox.getAttribute("role")).toBe("listbox");

    const items = document.querySelectorAll("[data-slot='select-item']");
    // Отметка выбранного варианта в разметку не попадает, пока варианта не выбрали, —
    // kobalte рендерит `SelectItemIndicator` только у выбранного.
    expect([...items].map((node) => node.textContent)).toEqual(["Москва", "Казань", "Пермь"]);
    expect(one(host, "[data-slot='select-trigger']").getAttribute("aria-expanded")).toBe("true");
  });

  it("каждая часть панели — ровно один узел своего тега", () => {
    const host = mount(() => <City />);
    press(one(host, "[data-slot='select-trigger']"));

    expect(one(document, "[data-slot='select-content']").tagName).toBe("DIV");
    expect(one(document, "[data-slot='select-item']").tagName).toBe("LI");
    expect(one(document, "[data-slot='select-item-label']").tagName).toBe("DIV");
  });

  it("выбор варианта зовёт `onChange` и закрывает панель", () => {
    const onChange = vi.fn();
    const host = mount(() => <City onChange={onChange} />);

    press(one(host, "[data-slot='select-trigger']"));
    press(one(document, "[data-slot='select-item']:nth-of-type(2)"));

    expect(onChange).toHaveBeenCalledWith("Казань");
    expect(document.querySelector("[data-slot='select-content']")).toBeNull();
  });

  it("управляемое значение приходит снаружи, а не из клика", () => {
    const [value, setValue] = createSignal("Москва");
    const host = mount(() => <City value={value()} onChange={(next) => setValue(next ?? "")} />);

    expect(one(host, "[data-slot='select-value']").textContent).toBe("Москва");

    setValue("Пермь");
    expect(one(host, "[data-slot='select-value']").textContent).toBe("Пермь");
  });

  it("отключённый список не открывается", () => {
    const host = mount(() => <City disabled />);
    press(one(host, "[data-slot='select-trigger']"));

    expect(document.querySelector("[data-slot='select-content']")).toBeNull();
  });
});

describe("Select — названное отступление от 1-to-1", () => {
  it("панель приезжает внутри позиционера — узла на один больше", () => {
    const host = mount(() => <City />);
    press(one(host, "[data-slot='select-trigger']"));

    const content = one(document, "[data-slot='select-content']");

    // Это ЕДИНСТВЕННОЕ отступление во всей зоне, и оно названо в доке компонента:
    // всплывающая панель обязана быть в потоке позиционирования floating-ui, а
    // координаты ставятся на отдельный узел-обёртку. Тест держит его ЯВНЫМ — вырастет
    // число узлов ещё на один, прогон это заметит.
    expect(content.parentElement?.hasAttribute("data-popper-positioner")).toBe(true);
    expect(content.parentElement?.children.length).toBe(1);
  });
});

describe("Select — стилей по умолчанию нет", () => {
  it("ни одна часть не приносит своего класса", () => {
    const host = mount(() => <City />);
    press(one(host, "[data-slot='select-trigger']"));

    for (const node of document.querySelectorAll("[data-slot^='select']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });
});
