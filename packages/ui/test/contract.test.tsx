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

import { Accordion, Collapsible, CollapsibleTrigger } from "../src/accordion.jsx";
import { AlertDialog, AlertDialogTrigger } from "../src/alert-dialog.jsx";
import { Button } from "../src/button/index.js";
import { Checkbox, CheckboxControl, CheckboxInput, CheckboxLabel } from "../src/checkbox.jsx";
import { ColorArea, ColorAreaBackground, ColorAreaThumb } from "../src/color-area.jsx";
import { ColorField, ColorFieldInput, ColorFieldLabel } from "../src/color-field.jsx";
import { ColorSlider, ColorSliderThumb, ColorSliderTrack } from "../src/color-slider.jsx";
import {
  Combobox,
  ComboboxControl,
  ComboboxInput,
  ComboboxLabel,
  ComboboxTrigger,
} from "../src/combobox.jsx";
import { ContextMenu, ContextMenuTrigger } from "../src/context-menu.jsx";
import { Dialog, DialogTrigger } from "../src/dialog.jsx";
import { DropdownMenu, DropdownMenuIcon, DropdownMenuTrigger } from "../src/dropdown-menu.jsx";
import { Field, FieldDescription, Input, Label, Textarea } from "../src/field.jsx";
import {
  NumberField,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldLabel,
} from "../src/number-field.jsx";
import { Breadcrumbs, BreadcrumbsLink, BreadcrumbsList, Link } from "../src/navigation.jsx";
import { Pagination, PaginationNext, PaginationPrevious } from "../src/pagination.jsx";
import { Menubar, MenubarMenu, MenubarTrigger } from "../src/menubar.jsx";
import {
  NavigationMenu,
  NavigationMenuMenu,
  NavigationMenuTrigger,
} from "../src/navigation-menu.jsx";
import { Popover, PopoverAnchor, PopoverTrigger } from "../src/popover.jsx";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupLabel,
} from "../src/radio-group.jsx";
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemInput,
  SegmentedControlTrack,
} from "../src/segmented-control.jsx";
import { Separator } from "../src/separator.jsx";
import { Skeleton } from "../src/skeleton.jsx";
import { Slider, SliderThumb, SliderTrack } from "../src/slider.jsx";
import { Slot } from "../src/slot.jsx";
import { Spinner } from "../src/spinner.jsx";
import { Switch, SwitchControl, SwitchInput, SwitchLabel, SwitchThumb } from "../src/switch.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../src/tabs.jsx";
import { ToggleGroup, ToggleGroupItem } from "../src/toggle-group.jsx";
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
    name: "ComboboxInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <Combobox<string> options={[]}>
        <ComboboxControl>
          <ComboboxInput {...props} />
        </ComboboxControl>
      </Combobox>
    ),
  },
  {
    name: "ComboboxTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Combobox<string> options={[]}>
        <ComboboxTrigger {...props} />
      </Combobox>
    ),
  },
  {
    name: "ComboboxLabel",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <Combobox<string> options={[]}>
        <ComboboxLabel {...props} />
      </Combobox>
    ),
  },
  {
    name: "NumberField",
    tag: "div",
    render: (props: Record<string, unknown>) => <NumberField {...props} />,
  },
  {
    name: "NumberFieldInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <NumberField>
        <NumberFieldInput {...props} />
      </NumberField>
    ),
  },
  {
    name: "NumberFieldIncrement",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <NumberField>
        <NumberFieldIncrement {...props} />
      </NumberField>
    ),
  },
  {
    name: "NumberFieldLabel",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <NumberField>
        <NumberFieldLabel {...props} />
      </NumberField>
    ),
  },
  {
    name: "ContextMenuTrigger",
    tag: "div",
    render: (props: Record<string, unknown>) => (
      <ContextMenu>
        <ContextMenuTrigger {...props} />
      </ContextMenu>
    ),
  },
  {
    name: "MenubarTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger {...props} />
        </MenubarMenu>
      </Menubar>
    ),
  },
  {
    name: "NavigationMenuTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <NavigationMenu>
        <NavigationMenuMenu>
          <NavigationMenuTrigger {...props} />
        </NavigationMenuMenu>
      </NavigationMenu>
    ),
  },
  {
    name: "Accordion",
    tag: "div",
    render: (props: Record<string, unknown>) => <Accordion {...props} />,
  },
  {
    name: "CollapsibleTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Collapsible>
        <CollapsibleTrigger {...props} />
      </Collapsible>
    ),
  },
  {
    name: "AlertDialogTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <AlertDialog>
        <AlertDialogTrigger {...props} />
      </AlertDialog>
    ),
  },
  {
    name: "Link",
    tag: "a",
    render: (props: Record<string, unknown>) => <Link href="/docs" {...props} />,
  },
  {
    name: "BreadcrumbsLink",
    tag: "a",
    render: (props: Record<string, unknown>) => (
      <Breadcrumbs>
        <BreadcrumbsLink href="/" {...props} />
      </Breadcrumbs>
    ),
  },
  {
    name: "PaginationPrevious",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      // `page={10}`, а не первая страница: на первой kobalte отключает «назад» сам, и
      // проверка обработчика проверяла бы отключённую кнопку.
      <Pagination count={20} page={10} itemComponent={() => null} ellipsisComponent={() => null}>
        <PaginationPrevious {...props} />
      </Pagination>
    ),
  },
  {
    name: "PaginationNext",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Pagination count={20} page={10} itemComponent={() => null} ellipsisComponent={() => null}>
        <PaginationNext {...props} />
      </Pagination>
    ),
  },
  {
    name: "Skeleton",
    tag: "div",
    render: (props: Record<string, unknown>) => <Skeleton {...props} />,
  },
  {
    name: "Slider",
    tag: "div",
    render: (props: Record<string, unknown>) => <Slider {...props} />,
  },
  {
    name: "SliderTrack",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Slider>
        <SliderTrack as="p" {...props} />
      </Slider>
    ),
  },
  {
    name: "SliderThumb",
    tag: "span",
    render: (props: Record<string, unknown>) => (
      <Slider>
        <SliderTrack>
          <SliderThumb {...props} />
        </SliderTrack>
      </Slider>
    ),
  },
  {
    name: "SegmentedControlTrack",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <SegmentedControl>
        <SegmentedControlTrack as="p" {...props} />
      </SegmentedControl>
    ),
  },
  {
    name: "BreadcrumbsList",
    tag: "ol",
    render: (props: Record<string, unknown>) => (
      <Breadcrumbs>
        <BreadcrumbsList {...props} />
      </Breadcrumbs>
    ),
  },
  {
    name: "SegmentedControlItemInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <SegmentedControl>
        <SegmentedControlItem value="список">
          <SegmentedControlItemInput {...props} />
        </SegmentedControlItem>
      </SegmentedControl>
    ),
  },
  {
    name: "ToggleGroupItem",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <ToggleGroup>
        <ToggleGroupItem value="bold" {...props} />
      </ToggleGroup>
    ),
  },
  {
    name: "DialogTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Dialog>
        <DialogTrigger {...props} />
      </Dialog>
    ),
  },
  {
    name: "Tabs",
    tag: "div",
    render: (props: Record<string, unknown>) => <Tabs {...props} />,
  },
  {
    name: "TabsList",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Tabs>
        <TabsList as="p" {...props} />
      </Tabs>
    ),
  },
  {
    name: "TabsTrigger",
    tag: "button",
    render: (props: Record<string, unknown>) => (
      <Tabs>
        <TabsList>
          <TabsTrigger value="вид" {...props} />
        </TabsList>
      </Tabs>
    ),
  },
  {
    name: "TabsContent",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <Tabs value="вид">
        <TabsContent as="p" value="вид" {...props} />
      </Tabs>
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
    name: "ColorField",
    tag: "div",
    render: (props: Record<string, unknown>) => <ColorField {...props} />,
  },
  {
    name: "ColorFieldInput",
    tag: "input",
    render: (props: Record<string, unknown>) => (
      <ColorField>
        <ColorFieldInput {...props} />
      </ColorField>
    ),
  },
  {
    name: "ColorFieldLabel",
    tag: "label",
    render: (props: Record<string, unknown>) => (
      <ColorField>
        <ColorFieldLabel {...props} />
      </ColorField>
    ),
  },
  {
    name: "ColorArea",
    tag: "div",
    render: (props: Record<string, unknown>) => <ColorArea {...props} />,
  },
  {
    // `as="p"` уводит подложку от тега корня — иначе селектор `div` поймал бы сам корень.
    name: "ColorAreaBackground",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <ColorArea>
        <ColorAreaBackground as="p" {...props} />
      </ColorArea>
    ),
  },
  {
    name: "ColorAreaThumb",
    tag: "span",
    render: (props: Record<string, unknown>) => (
      <ColorArea>
        <ColorAreaBackground>
          <ColorAreaThumb {...props} />
        </ColorAreaBackground>
      </ColorArea>
    ),
  },
  {
    // `channel` обязателен: без него неизвестно, что ползунок меняет, и градиента не
    // существует. Ставится ДО спреда — потребитель вправе его перебить.
    name: "ColorSlider",
    tag: "div",
    render: (props: Record<string, unknown>) => <ColorSlider channel="hue" {...props} />,
  },
  {
    name: "ColorSliderTrack",
    tag: "p",
    render: (props: Record<string, unknown>) => (
      <ColorSlider channel="hue">
        <ColorSliderTrack as="p" {...props} />
      </ColorSlider>
    ),
  },
  {
    name: "ColorSliderThumb",
    tag: "span",
    render: (props: Record<string, unknown>) => (
      <ColorSlider channel="hue">
        <ColorSliderTrack>
          <ColorSliderThumb {...props} />
        </ColorSliderTrack>
      </ColorSlider>
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
 * Части, на которых `@kobalte/core` держит СВОЙ служебный стиль. Ни одна строка в нём не про
 * вид — это механика, и каждый случай разобран отдельным тестом в файле своего примитива:
 *
 *   • спрятанные вводы — `visuallyHiddenStyles`: настоящий `<input>` обязан остаться в
 *     документе ради фокуса, формы и скринридера, но не должен быть виден (`checkbox.test.tsx`);
 *   • числовой ввод — `touch-action: none`: иначе жест прокрутки по полю менял бы значение
 *     (`number-field.test.tsx`).
 *
 * Список ЯВНЫЙ: проверка не ослаблена, у неё названы исключения.
 */
const WITH_SERVICE_STYLE = new Set([
  "CheckboxInput",
  "SwitchInput",
  "RadioGroupItemInput",
  "SegmentedControlItemInput",
  "NumberFieldInput",
  // Бегунок ползунка: положение считает kobalte и пишет его сюда (`test/slider.test.tsx`).
  "SliderThumb",
  // Заглушка: `width`/`height` — это пропы размера kobalte, а не вид (`test/progress.test.tsx`).
  "Skeleton",
  // Цветовые: на подложке и дорожке — градиенты, посчитанные ИЗ значения, на бегунках —
  // координаты и переменная `--kb-color-current`. Это не вид, а сами данные примитива:
  // показывать нужно те цвета, между которыми выбирают, а знает их только он. Разобрано в
  // `test/color-area.test.tsx` и `test/color-slider.test.tsx` — там же проверено, что стиль
  // потребителя с нашим СЛИВАЕТСЯ, а не затирается.
  "ColorAreaBackground",
  "ColorAreaThumb",
  "ColorSliderTrack",
  "ColorSliderThumb",
]);

describe("стилей по умолчанию нет", () => {
  for (const primitive of PRIMITIVES) {
    it(primitive.name, () => {
      const host = mount(() => primitive.render({}));
      const node = host.querySelector(primitive.tag);

      // Ни класса, ни инлайнового стиля: оформление приезжает от потребителя, а не от нас.
      // Атрибут отсутствует целиком — пустая строка тоже считается провалом, потому что она
      // означает, что кто-то в цепочке всё-таки взялся за `class`.
      expect(node?.hasAttribute("class")).toBe(false);

      if (!WITH_SERVICE_STYLE.has(primitive.name)) {
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
