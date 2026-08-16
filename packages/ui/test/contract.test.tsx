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
import { Checkbox, CheckboxControl, CheckboxInput, CheckboxLabel } from "../src/checkbox.jsx";
import { DropdownMenu, DropdownMenuIcon, DropdownMenuTrigger } from "../src/dropdown-menu.jsx";
import { Field, FieldDescription, Input, Label, Textarea } from "../src/field.jsx";
import { Popover, PopoverAnchor, PopoverTrigger } from "../src/popover.jsx";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupLabel,
} from "../src/radio-group.jsx";
import { Separator } from "../src/separator.jsx";
import { Slot } from "../src/slot.jsx";
import { Spinner } from "../src/spinner.jsx";
import { Switch, SwitchControl, SwitchInput, SwitchLabel, SwitchThumb } from "../src/switch.jsx";
import { Toggle } from "../src/toggle.jsx";
import { Tooltip, TooltipTrigger } from "../src/tooltip.jsx";
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
    name: "Checkbox",
    tag: "div",
    render: (props: Record<string, unknown>) => <Checkbox {...props} />,
  },
  {
    name: "CheckboxInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <Checkbox>
        <CheckboxInput {...props} />
      </Checkbox>
    ),
  },
  {
    // `as="p"` уводит часть от тега корня — иначе селектор `div` поймал бы сам корень.
    name: "CheckboxControl",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Checkbox>
        <CheckboxControl as="p" {...props} />
      </Checkbox>
    ),
  },
  {
    name: "CheckboxLabel",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <Checkbox>
        <CheckboxLabel {...props} />
      </Checkbox>
    ),
  },
  {
    name: "Switch",
    tag: "div",
    render: (props: Record<string, unknown>) => <Switch {...props} />,
  },
  {
    name: "SwitchInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <Switch>
        <SwitchInput {...props} />
      </Switch>
    ),
  },
  {
    name: "SwitchControl",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Switch>
        <SwitchControl as="p" {...props} />
      </Switch>
    ),
  },
  {
    name: "SwitchThumb",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Switch>
        <SwitchThumb as="p" {...props} />
      </Switch>
    ),
  },
  {
    name: "SwitchLabel",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <Switch>
        <SwitchLabel {...props} />
      </Switch>
    ),
  },
  {
    name: "RadioGroup",
    tag: "div",
    render: (props: Record<string, unknown>) => <RadioGroup {...props} />,
  },
  {
    name: "RadioGroupLabel",
    tag: "span",
    render: (props: Record<string, unknown>) => (
      <RadioGroup>
        <RadioGroupLabel {...props} />
      </RadioGroup>
    ),
  },
  {
    name: "RadioGroupItem",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <RadioGroup>
        <RadioGroupItem as="p" value="S" {...props} />
      </RadioGroup>
    ),
  },
  {
    name: "RadioGroupItemInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <RadioGroup>
        <RadioGroupItem value="S">
          <RadioGroupItemInput {...props} />
        </RadioGroupItem>
      </RadioGroup>
    ),
  },
  {
    name: "RadioGroupItemLabel",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <RadioGroup>
        <RadioGroupItem value="S">
          <RadioGroupItemLabel {...props} />
        </RadioGroupItem>
      </RadioGroup>
    ),
  },
  {
    name: "DropdownMenuTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <DropdownMenu>
        <DropdownMenuTrigger {...props} />
      </DropdownMenu>
    ),
  },
  {
    name: "DropdownMenuIcon",
    tag: "span",
    render: (props: Record<string, unknown>) => (
      <DropdownMenu>
        <DropdownMenuTrigger>
          <DropdownMenuIcon {...props} />
        </DropdownMenuTrigger>
      </DropdownMenu>
    ),
  },
  {
    // Части, живущие в портале (панель, стрелка, заголовок), проверяются теми же тремя
    // проверками в своих файлах: общий перечень смотрит в контейнер монтирования, а портал
    // выносит узлы в конец документа.
    name: "PopoverTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Popover>
        <PopoverTrigger {...props} />
      </Popover>
    ),
  },
  {
    name: "PopoverAnchor",
    tag: "div",
    render: (props: Record<string, unknown>) => (
      <Popover>
        <PopoverAnchor {...props} />
      </Popover>
    ),
  },
  {
    name: "TooltipTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Tooltip>
        <TooltipTrigger {...props} />
      </Tooltip>
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

/**
 * Спрятанные вводы — ЕДИНСТВЕННОЕ отступление от «ноль стилей по умолчанию» во всей зоне.
 *
 * Стиль ставит сам `@kobalte/core` (`visuallyHiddenStyles`), и он не про вид, а про механику
 * доступности: настоящий `<input>` обязан остаться в документе ради фокуса, формы и
 * скринридера, но не должен быть виден — рисуют соседний `*-control`. Отступление названо
 * здесь и разобрано отдельными тестами в `test/checkbox.test.tsx`, которые пиняют, ЧТО именно
 * это за стиль и что стиль потребителя доезжает поверх.
 */
const HIDDEN_INPUTS = new Set(["CheckboxInput", "SwitchInput", "RadioGroupItemInput"]);

describe("стилей по умолчанию нет", () => {
  for (const primitive of PRIMITIVES) {
    it(primitive.name, () => {
      const host = mount(() => primitive.render({}));
      const node = host.querySelector(primitive.tag);

      // Ни класса, ни инлайнового стиля: оформление приезжает от потребителя, а не от нас.
      // Атрибут отсутствует целиком — пустая строка тоже считается провалом, потому что она
      // означает, что кто-то в цепочке всё-таки взялся за `class`.
      expect(node?.hasAttribute("class")).toBe(false);

      if (!HIDDEN_INPUTS.has(primitive.name)) {
        expect(node?.hasAttribute("style")).toBe(false);
      }
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
