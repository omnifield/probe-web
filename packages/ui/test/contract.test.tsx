// Три принципа контракта зоны — ОДНИМ перечнем по ВСЕМ примитивам сразу (`kb:PROBEWEB-4`).
//
// Отдельным тестом на каждый примитив это не проверить осмысленно: принцип общий, и сломать
// его можно ровно одним способом — «доработать» пропсы в обёртке. Перечень же падает на том
// примитиве, где обёртка перестала быть прозрачной, и называет его по имени.
//
//   1. `ref` потребителя доезжает ДО DOM-узла;
//   2. обработчик потребителя доходит и вызывается;
//   3. стилей по умолчанию нет — атрибута `class` на узле не появляется само.
//
// Проверка 1-to-1 живёт в тестах самих примитивов: там известно, КАКОЙ узел ожидается.

import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../src/button.jsx";
import { Field, FieldDescription, Input, Label, Textarea } from "../src/field.jsx";
import { Separator } from "../src/separator.jsx";
import { Slot } from "../src/slot.jsx";
import { Spinner } from "../src/spinner.jsx";
import { Toggle } from "../src/toggle.jsx";
import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

/**
 * Перечень примитивов под общие проверки.
 *
 * `render` получает пропсы и обязан довести их до узла — именно это и есть предмет. Части
 * семейства поля обёрнуты в `Field`: без его контекста они не работают, и это названная цена
 * решения (см. `src/field.tsx`), а не дефект.
 */
const PRIMITIVES = [
  {
    name: "Slot",
    tag: "div",
    render: (props: Record<string, unknown>) => <Slot {...props} />,
  },
  {
    name: "Button",
    tag: "button",
    render: (props: Record<string, unknown>) => <Button {...props} />,
  },
  {
    name: "Toggle",
    tag: "button",
    render: (props: Record<string, unknown>) => <Toggle {...props} />,
  },
  {
    name: "Separator",
    tag: "hr",
    render: (props: Record<string, unknown>) => <Separator {...props} />,
  },
  {
    name: "Spinner",
    tag: "span",
    render: (props: Record<string, unknown>) => <Spinner {...props} />,
  },
  {
    name: "Field",
    tag: "div",
    render: (props: Record<string, unknown>) => <Field {...props} />,
  },
  {
    name: "Label",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <Field>
        <Label {...props} />
      </Field>
    ),
  },
  {
    name: "Input",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <Field>
        <Input {...props} />
      </Field>
    ),
  },
  {
    name: "Textarea",
    tag: "textarea",
    render: (props: Record<string, unknown>) => (
      <Field>
        <Textarea {...props} />
      </Field>
    ),
  },
  {
    name: "FieldDescription",
    // `as="p"` не только уводит пояснение от тега корня `Field` (иначе селектор `div` ловил
    // бы корень), но и проверяет заодно, что полиморфизм не теряется в обёртке.
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Field>
        <FieldDescription as="p" {...props} />
      </Field>
    ),
  },
] as const;

describe("ref потребителя доезжает до DOM-узла", () => {
  for (const primitive of PRIMITIVES) {
    it(primitive.name, () => {
      let received: Element | undefined;

      const host = mount(() =>
        primitive.render({
          ref: (el: Element) => {
            received = el;
          },
        }),
      );

      // Не «ref вызвался», а «в ref пришёл ИМЕННО тот узел, который оказался в документе».
      // Первое верно и когда обёртка отдала свой внутренний элемент.
      expect(received).toBeInstanceOf(Element);
      expect(received).toBe(host.querySelector(primitive.tag));
    });
  }
});

describe("обработчик потребителя доходит до узла", () => {
  for (const primitive of PRIMITIVES) {
    it(primitive.name, () => {
      const onClick = vi.fn();

      const host = mount(() => primitive.render({ onClick }));
      host.querySelector<HTMLElement>(primitive.tag)?.click();

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  }
});

describe("стилей по умолчанию нет", () => {
  for (const primitive of PRIMITIVES) {
    it(primitive.name, () => {
      const host = mount(() => primitive.render({}));
      const node = host.querySelector(primitive.tag);

      // Ни класса, ни инлайнового стиля: оформление приезжает от потребителя, а не от нас.
      // Атрибут отсутствует целиком — пустая строка тоже считается провалом, потому что она
      // означает, что кто-то в цепочке всё-таки взялся за `class`.
      expect(node?.hasAttribute("class")).toBe(false);
      expect(node?.hasAttribute("style")).toBe(false);
    });
  }
});

describe("class потребителя доезжает без примеси", () => {
  for (const primitive of PRIMITIVES) {
    it(primitive.name, () => {
      const host = mount(() => primitive.render({ class: "мой-класс" }));

      // Ровно то, что передали: обёртка ничего не подмешивает и ничего не переставляет.
      expect(host.querySelector(primitive.tag)?.getAttribute("class")).toBe("мой-класс");
    });
  }
});

describe("data-slot — дефолт, а не печать поверх", () => {
  for (const primitive of PRIMITIVES) {
    // У `Slot` зацепки нет намеренно: семантику узла задаёт `as` потребителя.
    if (primitive.name === "Slot") continue;

    it(primitive.name, () => {
      const host = mount(() => primitive.render({ "data-slot": "своя-зацепка" }));

      expect(host.querySelector(primitive.tag)?.getAttribute("data-slot")).toBe("своя-зацепка");
    });
  }
});
