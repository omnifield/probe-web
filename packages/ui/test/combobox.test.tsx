import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Combobox,
  ComboboxContent,
  ComboboxControl,
  ComboboxHiddenSelect,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxLabel,
  ComboboxListbox,
  ComboboxPortal,
  ComboboxSection,
  ComboboxTrigger,
} from "../src/combobox.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const CITIES = ["Москва", "Казань", "Пермь"];

/** Поиск города — сборка, та же что в доке компонента. */
function City(props: {
  open?: boolean;
  value?: string;
  options?: string[];
  onChange?: (value: string | null) => void;
  onInputChange?: (query: string) => void;
}) {
  return (
    <Combobox<string>
      options={props.options ?? CITIES}
      open={props.open}
      value={props.value}
      onChange={props.onChange}
      onInputChange={props.onInputChange}
      placeholder="Город"
      itemComponent={(item) => (
        <ComboboxItem item={item.item}>
          <ComboboxItemLabel>{item.item.rawValue}</ComboboxItemLabel>
          <ComboboxItemIndicator>✓</ComboboxItemIndicator>
        </ComboboxItem>
      )}
    >
      <ComboboxLabel>Город</ComboboxLabel>
      <ComboboxControl>
        <ComboboxInput />
        <ComboboxTrigger>
          <ComboboxIcon>▾</ComboboxIcon>
        </ComboboxTrigger>
      </ComboboxControl>
      <ComboboxHiddenSelect />
      <ComboboxPortal>
        <ComboboxContent>
          <ComboboxListbox />
        </ComboboxContent>
      </ComboboxPortal>
    </Combobox>
  );
}

describe("Combobox — узлы", () => {
  it("ввод НАСТОЯЩИЙ — вот чем это отличается от `Select`", () => {
    const host = mount(() => <City />);
    const input = one<HTMLInputElement>(host, "[data-slot='combobox-input']");

    // У списка здесь кнопка, у поиска — поле, в которое печатают. Отсюда и лишние части:
    // рамка вокруг ввода с кнопкой и скрытый `<select>` для формы.
    expect(input.tagName).toBe("INPUT");
    expect(input.getAttribute("role")).toBe("combobox");
    expect(one(host, "[data-slot='combobox-trigger']").tagName).toBe("BUTTON");
    expect(one(host, "[data-slot='combobox-control']").contains(input)).toBe(true);
  });

  it("подпись связана с вводом", () => {
    const host = mount(() => <City />);

    expect(one<HTMLLabelElement>(host, "[data-slot='combobox-label']").htmlFor).toBe(
      one(host, "[data-slot='combobox-input']").id,
    );
  });

  it("скрытый `<select>` уносит в форму ВЫБРАННОЕ значение, а не текст запроса", () => {
    const host = mount(() => <City value="Казань" />);
    const hidden = one<HTMLSelectElement>(host, "[data-slot='combobox-hidden-select']");

    expect(hidden.tagName).toBe("SELECT");
    expect(hidden.value).toBe("Казань");
  });

  it("панели нет, пока список не раскрыт", () => {
    mount(() => <City />);

    expect(document.querySelector("[data-slot='combobox-content']")).toBeNull();
  });
});

describe("Combobox — раскрытие и выбор", () => {
  it("кнопка раскрывает список найденного", () => {
    const host = mount(() => <City />);
    press(one(host, "[data-slot='combobox-trigger']"));

    expect(one(document, "[data-slot='combobox-listbox']").tagName).toBe("UL");
    expect(
      [...document.querySelectorAll("[data-slot='combobox-item']")].map((n) => n.textContent),
    ).toEqual(CITIES);
  });

  it("выбор варианта зовёт `onChange`", () => {
    const onChange = vi.fn();
    mount(() => <City open onChange={onChange} />);

    press(document.querySelectorAll("[data-slot='combobox-item']")[1]);

    expect(onChange).toHaveBeenCalledWith("Казань");
  });

  it("отметка стоит у выбранного варианта", () => {
    mount(() => <City open value="Пермь" />);

    const indicator = one(document, "[data-slot='combobox-item-indicator']");
    expect(indicator.closest("[data-slot='combobox-item']")?.textContent).toContain("Пермь");
  });

  it("фильтрация встроена: набор сужает список сам, без единой строки потребителя", () => {
    // Это поведение `@kobalte/core` (`defaultFilter: "contains"` поверх `Intl.Collator`), а не
    // наша надстройка. Знать о нём надо заранее: потребитель, ждущий «кит отдаёт запрос, я
    // фильтрую», получит ДВОЙНУЮ фильтрацию — свою поверх встроенной.
    const onInputChange = vi.fn();
    const host = mount(() => <City open onInputChange={onInputChange} />);

    const input = one<HTMLInputElement>(host, "[data-slot='combobox-input']");
    input.value = "Ка";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onInputChange).toHaveBeenCalledWith("Ка");

    const found = [...document.querySelectorAll("[data-slot='combobox-item']")];
    expect(found.map((node) => node.textContent)).toEqual(["Казань"]);
  });

  it("встроенный поиск не зависит от регистра — это `Intl.Collator`, а не `includes`", () => {
    const host = mount(() => <City open />);

    const input = one<HTMLInputElement>(host, "[data-slot='combobox-input']");
    input.value = "пермь";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(
      [...document.querySelectorAll("[data-slot='combobox-item']")].map((n) => n.textContent),
    ).toEqual(["Пермь"]);
  });

  it("своя функция сравнения перебивает встроенную", () => {
    // Путь для случаев, где встроенного мало: поиск по нескольким полям, нечёткое совпадение.
    const host = mount(() => (
      <Combobox<string>
        open
        options={CITIES}
        defaultFilter={(option, query) => String(option).startsWith(query)}
        itemComponent={(item) => <ComboboxItem item={item.item}>{item.item.rawValue}</ComboboxItem>}
      >
        <ComboboxControl>
          <ComboboxInput />
        </ComboboxControl>
        <ComboboxPortal>
          <ComboboxContent>
            <ComboboxListbox />
          </ComboboxContent>
        </ComboboxPortal>
      </Combobox>
    ));

    const input = one<HTMLInputElement>(host, "[data-slot='combobox-input']");
    input.value = "зань";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    // Встроенный `contains` нашёл бы «Казань»; наш `startsWith` — ничего.
    expect(document.querySelectorAll("[data-slot='combobox-item']").length).toBe(0);
  });

  it("сузился список — сузилась и панель, потому что варианты пришли снаружи", () => {
    mount(() => <City open options={["Казань"]} />);

    expect(document.querySelectorAll("[data-slot='combobox-item']").length).toBe(1);
  });
});

describe("Combobox — разделы списка", () => {
  it("заголовок раздела — `li`, иначе разметка списка сломана", () => {
    type Group = { край: string; города: string[] };

    mount(() => (
      <Combobox<string, Group>
        open
        options={[{ край: "Поволжье", города: ["Казань", "Пермь"] }]}
        optionGroupChildren="города"
        itemComponent={(item) => <ComboboxItem item={item.item}>{item.item.rawValue}</ComboboxItem>}
        sectionComponent={(section) => (
          <ComboboxSection>{section.section.rawValue.край}</ComboboxSection>
        )}
      >
        <ComboboxControl>
          <ComboboxInput />
        </ComboboxControl>
        <ComboboxPortal>
          <ComboboxContent>
            <ComboboxListbox />
          </ComboboxContent>
        </ComboboxPortal>
      </Combobox>
    ));

    const section = one(document, "[data-slot='combobox-section']");

    // Раздел лежит ВНУТРИ `<ul>`, поэтому он `li`: иначе список перестаёт быть валидным, а
    // вспомогательная техника сбивается со счёта вариантов.
    expect(section.tagName).toBe("LI");
    expect(section.textContent).toBe("Поволжье");
  });
});

describe("Combobox — стилей по умолчанию нет", () => {
  const WITH_SERVICE_STYLE = new Set(["combobox-content", "combobox-hidden-select"]);

  it("ни одна часть не приносит своего класса", () => {
    mount(() => <City open value="Казань" />);

    for (const node of document.querySelectorAll("[data-slot^='combobox']")) {
      expect(node.hasAttribute("class")).toBe(false);

      if (!WITH_SERVICE_STYLE.has(node.getAttribute("data-slot") as string)) {
        expect(node.hasAttribute("style")).toBe(false);
      }
    }
  });

  it("скрытый `<select>` унесён из вида ОБЁРТКОЙ — названное отступление от 1-to-1", () => {
    // Зацепка стоит на `<select>`, но узлов приезжает больше: kobalte заворачивает его в
    // скрытый `<div>` и кладёт рядом технический `<input>` — обход особенностей Safari и
    // Firefox, названный в его исходнике. Стиль поэтому на ОБЁРТКЕ, а не на зацепке.
    const host = mount(() => <City />);
    const hidden = one(host, "[data-slot='combobox-hidden-select']");

    expect(hidden.hasAttribute("style")).toBe(false);
    expect(hidden.parentElement?.getAttribute("style")).toContain("position: absolute");
    expect(hidden.parentElement?.getAttribute("aria-hidden")).toBe("true");
  });
});
