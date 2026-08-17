// Гейт ОБЯЗАТЕЛЬСТВА по `data-slot` (`kb:PROBEWEB-12`, пункт 7).
//
// Зона `skin` цепляется за имена слотов, и на них держится всё её оформление. Обещание
// «имена не меняются и не исчезают без мажора» без проверки живёт ровно до первого
// переименования: исчезнувшая зацепка не ломает ни сборку, ни типы, ни один тест поведения —
// разметка остаётся валидной, а оформление у потребителя просто перестаёт применяться.
// Узнаёт об этом он сам, глазами, и уже после выпуска.
//
// Поэтому перечень стерегут С ДВУХ сторон, и обе стороны нужны:
//
//   1. КАЖДОЕ обещанное имя обязано появиться в живом документе. Удалили слот, переименовали
//      его, обменяли местами два имени — прогон краснеет и называет имя.
//   2. КАЖДАЯ зацепка из исходников обязана быть в перечне. Новый слот добавлять можно и без
//      мажора, но молча — нельзя: не попав в перечень, он не станет обещанием, и потребитель
//      будет цепляться за то, чего мы ему не обещали.
//
// Проверка первая — RENDER, как и весь предмет зоны: снятая с модуля зацепка не отличается
// от поставленной на узел. Проверка вторая читает исходники и потому живёт рядом, а не в
// сборочном прогоне: у обеих один предмет и один адрес, куда смотреть при красноте.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

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
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../src/alert-dialog.jsx";
import { Button } from "../src/button.jsx";
import {
  Checkbox,
  CheckboxControl,
  CheckboxDescription,
  CheckboxError,
  CheckboxIndicator,
  CheckboxInput,
  CheckboxLabel,
} from "../src/checkbox.jsx";
import {
  Combobox,
  ComboboxArrow,
  ComboboxContent,
  ComboboxControl,
  ComboboxDescription,
  ComboboxError,
  ComboboxHiddenSelect,
  ComboboxIcon,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemDescription,
  ComboboxItemIndicator,
  ComboboxItemLabel,
  ComboboxLabel,
  ComboboxListbox,
  ComboboxPortal,
  ComboboxSection,
  ComboboxTrigger,
} from "../src/combobox.jsx";
import {
  ContextMenu,
  ContextMenuArrow,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuIcon,
  ContextMenuItem,
  ContextMenuItemDescription,
  ContextMenuItemIndicator,
  ContextMenuItemLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../src/context-menu.jsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog.jsx";
import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuIcon,
  DropdownMenuItem,
  DropdownMenuItemDescription,
  DropdownMenuItemIndicator,
  DropdownMenuItemLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../src/dropdown-menu.jsx";
import { Field, FieldDescription, FieldError, Input, Label, Textarea } from "../src/field.jsx";
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldDescription,
  NumberFieldError,
  NumberFieldHiddenInput,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldLabel,
} from "../src/number-field.jsx";
import {
  Menubar,
  MenubarArrow,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarGroupLabel,
  MenubarIcon,
  MenubarItem,
  MenubarItemDescription,
  MenubarItemIndicator,
  MenubarItemLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "../src/menubar.jsx";
import {
  NavigationMenu,
  NavigationMenuArrow,
  NavigationMenuCheckboxItem,
  NavigationMenuContent,
  NavigationMenuGroup,
  NavigationMenuGroupLabel,
  NavigationMenuIcon,
  NavigationMenuItem,
  NavigationMenuItemDescription,
  NavigationMenuItemIndicator,
  NavigationMenuItemLabel,
  NavigationMenuMenu,
  NavigationMenuPortal,
  NavigationMenuRadioGroup,
  NavigationMenuRadioItem,
  NavigationMenuSeparator,
  NavigationMenuSub,
  NavigationMenuSubContent,
  NavigationMenuSubTrigger,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../src/navigation-menu.jsx";
import {
  Breadcrumbs,
  BreadcrumbsLink,
  BreadcrumbsSeparator,
  Image,
  ImageFallback,
  ImageImg,
  Link,
} from "../src/navigation.jsx";
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from "../src/pagination.jsx";
import {
  Progress,
  ProgressFill,
  ProgressLabel,
  ProgressTrack,
  ProgressValueLabel,
} from "../src/progress.jsx";
import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverPortal,
  PopoverTitle,
  PopoverTrigger,
} from "../src/popover.jsx";
import {
  RadioGroup,
  RadioGroupDescription,
  RadioGroupError,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemIndicator,
  RadioGroupItemInput,
  RadioGroupItemLabel,
  RadioGroupLabel,
} from "../src/radio-group.jsx";
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
import {
  SegmentedControl,
  SegmentedControlDescription,
  SegmentedControlError,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlItemControl,
  SegmentedControlItemDescription,
  SegmentedControlItemIndicator,
  SegmentedControlItemInput,
  SegmentedControlItemLabel,
  SegmentedControlLabel,
} from "../src/segmented-control.jsx";
import { Separator } from "../src/separator.jsx";
import { Skeleton } from "../src/skeleton.jsx";
import {
  Slider,
  SliderDescription,
  SliderError,
  SliderFill,
  SliderInput,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
} from "../src/slider.jsx";
import { Spinner } from "../src/spinner.jsx";
import {
  Switch,
  SwitchControl,
  SwitchDescription,
  SwitchError,
  SwitchInput,
  SwitchLabel,
  SwitchThumb,
} from "../src/switch.jsx";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastList,
  ToastProgressFill,
  ToastProgressTrack,
  ToastRegion,
  ToastTitle,
  toaster,
} from "../src/toast.jsx";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../src/toggle-group.jsx";
import {
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from "../src/tabs.jsx";
import { Toggle } from "../src/toggle.jsx";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "../src/tooltip.jsx";
import { cleanup, mount, nextTask, one, press } from "./dom.jsx";
import { PROMISED_SLOTS } from "./slot-list.js";

afterEach(() => {
  toaster.clear();
  cleanup();
});

const CITIES = ["Москва", "Казань", "Пермь"];

/**
 * Сцена, в которой каждая зацепка зоны оказывается в документе одновременно.
 *
 * Состояния здесь выставлены НАРОЧНО, потому что иначе этих слотов в документе нет вовсе:
 * `validationState="invalid"` — иначе kobalte не рендерит сообщение об ошибке; включённое
 * состояние флажка и выбранный вариант — иначе не рендерятся отметки (`*-indicator`);
 * выбранный город — то же самое у списка. Панель списка открывает сам тест: до открытия её
 * узлы живут в портале, которого ещё не существует.
 *
 * `Input` и `Textarea` стоят в РАЗНЫХ полях: у корня `Field` один идентификатор ввода на
 * поле, и два ввода в одном корне спорили бы за связку `for`↔`id`.
 */
function Scene() {
  return (
    <>
      <Button>Отправить</Button>
      <Toggle>Жирный</Toggle>
      <Separator />
      <Spinner />

      <Field validationState="invalid">
        <Label>Почта</Label>
        <Input type="email" />
        <FieldDescription>Куда придёт письмо</FieldDescription>
        <FieldError>Не похоже на адрес</FieldError>
      </Field>

      <Field>
        <Textarea />
      </Field>

      <Checkbox checked validationState="invalid">
        <CheckboxInput />
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Согласен</CheckboxLabel>
        <CheckboxDescription>Условия обслуживания</CheckboxDescription>
        <CheckboxError>Без согласия нельзя</CheckboxError>
      </Checkbox>

      <Switch checked validationState="invalid">
        <SwitchInput />
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchLabel>Тёмная тема</SwitchLabel>
        <SwitchDescription>Переключится сразу</SwitchDescription>
        <SwitchError>Тема недоступна</SwitchError>
      </Switch>

      <RadioGroup value="S" validationState="invalid">
        <RadioGroupLabel>Размер</RadioGroupLabel>
        <RadioGroupDescription>Как в таблице размеров</RadioGroupDescription>
        <RadioGroupError>Размер не выбран</RadioGroupError>
        <RadioGroupItem value="S">
          <RadioGroupItemInput />
          <RadioGroupItemControl>
            <RadioGroupItemIndicator />
          </RadioGroupItemControl>
          <RadioGroupItemLabel>S</RadioGroupItemLabel>
          <RadioGroupItemDescription>до 46</RadioGroupItemDescription>
        </RadioGroupItem>
      </RadioGroup>

      <Combobox<string, { край: string; города: string[] }>
        open
        value="Казань"
        validationState="invalid"
        options={[{ край: "Поволжье", города: ["Казань", "Пермь"] }]}
        optionGroupChildren="города"
        itemComponent={(item) => (
          <ComboboxItem item={item.item}>
            <ComboboxItemLabel>{item.item.rawValue}</ComboboxItemLabel>
            <ComboboxItemDescription>город</ComboboxItemDescription>
            <ComboboxItemIndicator>✓</ComboboxItemIndicator>
          </ComboboxItem>
        )}
        sectionComponent={(section) => (
          <ComboboxSection>{section.section.rawValue.край}</ComboboxSection>
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
        <ComboboxDescription>Начните печатать</ComboboxDescription>
        <ComboboxError>Город не найден</ComboboxError>
        <ComboboxPortal>
          <ComboboxContent>
            <ComboboxArrow />
            <ComboboxListbox />
          </ComboboxContent>
        </ComboboxPortal>
      </Combobox>

      <NumberField rawValue={2} validationState="invalid">
        <NumberFieldLabel>Количество</NumberFieldLabel>
        <NumberFieldDecrement>−</NumberFieldDecrement>
        <NumberFieldInput />
        <NumberFieldIncrement>+</NumberFieldIncrement>
        <NumberFieldHiddenInput />
        <NumberFieldDescription>Штук в заказе</NumberFieldDescription>
        <NumberFieldError>Не меньше нуля</NumberFieldError>
      </NumberField>



      <Menubar>
        <MenubarMenu open>
          <MenubarTrigger>
            Файл
            <MenubarIcon>▾</MenubarIcon>
          </MenubarTrigger>
          <MenubarPortal>
            <MenubarContent>
            <MenubarArrow />
            <MenubarGroup>
              <MenubarGroupLabel>Правка</MenubarGroupLabel>
              <MenubarItem>
                <MenubarItemLabel>Переименовать</MenubarItemLabel>
                <MenubarItemDescription>F2</MenubarItemDescription>
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarCheckboxItem checked>
              Скрытые
              <MenubarItemIndicator>✓</MenubarItemIndicator>
            </MenubarCheckboxItem>
            <MenubarRadioGroup value="имя">
              <MenubarRadioItem value="имя">По имени</MenubarRadioItem>
            </MenubarRadioGroup>
            <MenubarSub open>
              <MenubarSubTrigger>Ещё</MenubarSubTrigger>
              <MenubarPortal>
                <MenubarSubContent>
                  <MenubarItem>Архивировать</MenubarItem>
                </MenubarSubContent>
              </MenubarPortal>
            </MenubarSub>
            </MenubarContent>
          </MenubarPortal>
        </MenubarMenu>
      </Menubar>



      <Accordion multiple value={["доставка"]}>
        <AccordionItem value="доставка">
          <AccordionHeader>
            <AccordionTrigger>Доставка</AccordionTrigger>
          </AccordionHeader>
          <AccordionContent>Курьером</AccordionContent>
        </AccordionItem>
      </Accordion>

      <Collapsible defaultOpen>
        <CollapsibleTrigger>Подробнее</CollapsibleTrigger>
        <CollapsibleContent>Мелкий шрифт</CollapsibleContent>
      </Collapsible>

      <AlertDialog open modal={false}>
        <AlertDialogTrigger>Удалить</AlertDialogTrigger>
        <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogContent>
            <AlertDialogTitle>Удалить безвозвратно?</AlertDialogTitle>
            <AlertDialogDescription>Восстановить нельзя</AlertDialogDescription>
            <AlertDialogClose>Отмена</AlertDialogClose>
          </AlertDialogContent>
        </AlertDialogPortal>
      </AlertDialog>

      <Breadcrumbs>
        <ol>
          <li>
            <BreadcrumbsLink href="/">Главная</BreadcrumbsLink>
            <BreadcrumbsSeparator />
          </li>
        </ol>
      </Breadcrumbs>

      <Link href="/docs">Документация</Link>

      {/* Две картинки, потому что состояния взаимоисключающие: загруженная показывает
          `image-img` и убирает заглушку, а картинка без источника — наоборот. */}
      <Image>
        <ImageImg src="/avatar.png" alt="Пётр" />
      </Image>

      <Image>
        <ImageFallback>П</ImageFallback>
      </Image>

      <Pagination
        count={20}
        page={10}
        itemComponent={(item) => <PaginationItem page={item.page}>{item.page}</PaginationItem>}
        ellipsisComponent={() => <PaginationEllipsis>…</PaginationEllipsis>}
      >
        <PaginationPrevious>Назад</PaginationPrevious>
        <PaginationItems />
        <PaginationNext>Вперёд</PaginationNext>
      </Pagination>

      <Slider value={[10, 90]} minValue={0} maxValue={100} validationState="invalid">
        <SliderLabel>Цена</SliderLabel>
        <SliderValueLabel />
        <SliderTrack>
          <SliderFill />
          <SliderThumb>
            <SliderInput />
          </SliderThumb>
        </SliderTrack>
        <SliderDescription>В рублях</SliderDescription>
        <SliderError>Границы разошлись</SliderError>
      </Slider>

      <Progress value={15} minValue={0} maxValue={30}>
        <ProgressLabel>Загрузка</ProgressLabel>
        <ProgressValueLabel />
        <ProgressTrack>
          <ProgressFill />
        </ProgressTrack>
      </Progress>

      <Skeleton visible>содержимое</Skeleton>

      <SegmentedControl value="список" validationState="invalid">
        <SegmentedControlLabel>Показывать</SegmentedControlLabel>
        <SegmentedControlIndicator />
        <SegmentedControlItem value="список">
          <SegmentedControlItemInput />
          <SegmentedControlItemControl>
            <SegmentedControlItemIndicator />
            <SegmentedControlItemLabel>список</SegmentedControlItemLabel>
          </SegmentedControlItemControl>
          <SegmentedControlItemDescription>строками</SegmentedControlItemDescription>
        </SegmentedControlItem>
        <SegmentedControlDescription>как показывать записи</SegmentedControlDescription>
        <SegmentedControlError>режим недоступен</SegmentedControlError>
      </SegmentedControl>

      <ToggleGroup multiple value={["bold"]}>
        <ToggleGroupItem value="bold">Ж</ToggleGroupItem>
      </ToggleGroup>

      <ToastRegion>
        <ToastList />
      </ToastRegion>

      <Popover open modal={false}>
        <PopoverTrigger>Настройки</PopoverTrigger>
        <PopoverAnchor />
        <PopoverPortal>
          <PopoverContent>
            <PopoverArrow />
            <PopoverTitle>Вид таблицы</PopoverTitle>
            <PopoverDescription>Порядок колонок</PopoverDescription>
            <PopoverClose>Готово</PopoverClose>
          </PopoverContent>
        </PopoverPortal>
      </Popover>

      {/* `modal={false}` в сцене НЕ случайность: модальное окно объявляет остальную страницу
          недоступной для указателя, и открыть после него меню нажатием уже нельзя. Предмет
          этой пробы — наличие зацепок, а модальность проверяется в `dialog.test.tsx`. */}
      <Dialog open modal={false}>
        <DialogTrigger>Удалить</DialogTrigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent>
            <DialogTitle>Удалить запись?</DialogTitle>
            <DialogDescription>Действие необратимо</DialogDescription>
            <DialogClose>Отмена</DialogClose>
          </DialogContent>
        </DialogPortal>
      </Dialog>

      <Tabs value="вид">
        <TabsList>
          <TabsTrigger value="вид">Вид</TabsTrigger>
          <TabsIndicator />
        </TabsList>
        <TabsContent value="вид">Настройки вида</TabsContent>
      </Tabs>

      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger>
          Ещё
          <DropdownMenuIcon>▾</DropdownMenuIcon>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent>
            <DropdownMenuArrow />
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel>Правка</DropdownMenuGroupLabel>
              <DropdownMenuItem>
                <DropdownMenuItemLabel>Переименовать</DropdownMenuItemLabel>
                <DropdownMenuItemDescription>F2</DropdownMenuItemDescription>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>
              Показывать скрытые
              <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="по имени">
              <DropdownMenuRadioItem value="по имени">По имени</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSub open>
              <DropdownMenuSubTrigger>Ещё действия</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Архивировать</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <Tooltip open>
        <TooltipTrigger>Сохранить</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <TooltipArrow />
            Ctrl+S
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>

      <Select<string>
        options={CITIES}
        placeholder="Город"
        value="Казань"
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
    </>
  );
}

/**
 * Два меню живут в ОТДЕЛЬНОЙ сцене, и это не прихоть.
 *
 * Ни навигацию, ни контекстное меню нельзя открыть пропом: у первой активный раздел ставит сам
 * компонент по нажатию, второе открывается только правой кнопкой. А в общей сцене нажатие до
 * них не доходит — рядом уже открыты окно, панель и меню, и любое из них держит фокус и
 * указатель. Ситуация искусственная (в живом интерфейсе так не бывает), поэтому разводим
 * сцены, а не подгоняем компоненты.
 */
function ApartScene() {
  return (
    <>
      <ContextMenu modal={false}>
        <ContextMenuTrigger>Строка таблицы</ContextMenuTrigger>
        <ContextMenuPortal>
          <ContextMenuContent>
            <ContextMenuIcon>▾</ContextMenuIcon>
            <ContextMenuArrow />
            <ContextMenuGroup>
              <ContextMenuGroupLabel>Правка</ContextMenuGroupLabel>
              <ContextMenuItem>
                <ContextMenuItemLabel>Переименовать</ContextMenuItemLabel>
                <ContextMenuItemDescription>F2</ContextMenuItemDescription>
              </ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>
              Скрытые
              <ContextMenuItemIndicator>✓</ContextMenuItemIndicator>
            </ContextMenuCheckboxItem>
            <ContextMenuRadioGroup value="имя">
              <ContextMenuRadioItem value="имя">По имени</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
            <ContextMenuSub open>
              <ContextMenuSubTrigger>Ещё</ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent>
                  <ContextMenuItem>Архивировать</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenuPortal>
      </ContextMenu>

      <NavigationMenu>
        <NavigationMenuMenu>
          <NavigationMenuTrigger>
            Продукты
            <NavigationMenuIcon>▾</NavigationMenuIcon>
          </NavigationMenuTrigger>
          <NavigationMenuPortal>
            <NavigationMenuContent>
            <NavigationMenuArrow />
            <NavigationMenuGroup>
              <NavigationMenuGroupLabel>Правка</NavigationMenuGroupLabel>
              <NavigationMenuItem href="/tables">
                <NavigationMenuItemLabel>Переименовать</NavigationMenuItemLabel>
                <NavigationMenuItemDescription>F2</NavigationMenuItemDescription>
              </NavigationMenuItem>
            </NavigationMenuGroup>
            <NavigationMenuSeparator />
            <NavigationMenuCheckboxItem checked>
              Скрытые
              <NavigationMenuItemIndicator>✓</NavigationMenuItemIndicator>
            </NavigationMenuCheckboxItem>
            <NavigationMenuRadioGroup value="имя">
              <NavigationMenuRadioItem value="имя">По имени</NavigationMenuRadioItem>
            </NavigationMenuRadioGroup>
            <NavigationMenuSub open>
              <NavigationMenuSubTrigger>Ещё</NavigationMenuSubTrigger>
              <NavigationMenuPortal>
                <NavigationMenuSubContent>
                  <NavigationMenuItem href="/tables">Архивировать</NavigationMenuItem>
                </NavigationMenuSubContent>
              </NavigationMenuPortal>
            </NavigationMenuSub>
            </NavigationMenuContent>
          </NavigationMenuPortal>
        </NavigationMenuMenu>
        <NavigationMenuViewport />
      </NavigationMenu>
    </>
  );
}

/** Имена зацепок, реально доехавшие до документа, — без повторов и по алфавиту. */
function slotsInDocument(): string[] {
  const found = [...document.querySelectorAll("[data-slot]")].map(
    (node) => node.getAttribute("data-slot") as string,
  );

  return [...new Set(found)].sort();
}

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "..", "src");

/**
 * Зацепки, поставленные исходником.
 *
 * Комментарии срезаются: в доке компонентов `data-slot` стоит примерами CSS, и правило из
 * такого примера не является зацепкой — предмет здесь только атрибут в разметке.
 */
function slotsInSource(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  return [...code.matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]);
}

describe("обещанные зацепки доезжают до документа", () => {
  it("перечень в документе совпадает с обещанным — ровно, без лишних и без пропавших", async () => {
    const apart = mount(() => <ApartScene />);
    press(one(apart, "[data-slot='navigation-menu-trigger']"));

    const area = one(apart, "[data-slot='context-menu-trigger']");
    area.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
    area.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, button: 2 }));

    // Снимаем их зацепки СРАЗУ: следующая сцена приводит в документ окно и панель, и
    // раскрытое меню закроется, отдав им фокус.
    const fromApart = slotsInDocument();

    const host = mount(() => <Scene />);

    // Уведомление — единственная часть зоны, которую нельзя поставить в разметку: она
    // появляется вызовом из кода. Поэтому сцена его показывает, а не рисует.
    toaster.show((props) => (
      <Toast toastId={props.toastId}>
        <ToastTitle>Сохранено</ToastTitle>
        <ToastDescription>Изменения уехали</ToastDescription>
        <ToastClose>×</ToastClose>
        <ToastProgressTrack>
          <ToastProgressFill />
        </ToastProgressTrack>
      </Toast>
    ));
    await nextTask();

    // Панель списка открывается ПОСЛЕ показа уведомления: ожидание такта отдаёт управление
    // kobalte, и открытая до него панель успела бы закрыться сама.
    press(one(host, "[data-slot='select-trigger']"));

    // Сравнение РАВЕНСТВОМ, а не вхождением: «содержит обещанные» пропустило бы зацепку,
    // которую в перечень не внесли, и обещание разъехалось бы с поставкой в другую сторону.
    const found = [...new Set([...fromApart, ...slotsInDocument()])].sort();

    expect(found).toEqual([...PROMISED_SLOTS].sort());
  });

  it("в перечне нет повторов — иначе равенство выше сошлось бы вслепую", () => {
    // Числа слотов здесь СОЗНАТЕЛЬНО нет: оно устаревает при каждом добавлении примитива, а
    // обещание — нет. Ровно по этой причине architect убрал его и из `kb:PROBEWEB-11`
    // (2026-08-16): контракт — перечень, а не его длина. Дубль же проверять надо: сравнение
    // множеств его не заметит, а перечень с повтором врёт про состав.
    expect(new Set(PROMISED_SLOTS).size).toBe(PROMISED_SLOTS.length);
  });
});

describe("зацепки исходников не выходят за обещанное", () => {
  const sources = readdirSync(srcDir)
    .filter((name) => name.endsWith(".tsx"))
    .map((name) => ({ name, slots: slotsInSource(readFileSync(join(srcDir, name), "utf8")) }));

  it("файлы с примитивами вообще нашлись", () => {
    // Иначе перебор по пустому списку файлов был бы зелёным и ничего не проверял. Порог, а не
    // точное число: файлов прибывает с каждым примитивом, и точное число здесь стало бы тем
    // самым снимком, который устаревает сам по себе.
    expect(sources.length).toBeGreaterThanOrEqual(10);
  });

  for (const source of sources) {
    it(source.name, () => {
      for (const slot of source.slots) expect(PROMISED_SLOTS).toContain(slot);
    });
  }

  it("`Slot` не ставит зацепки — своего имени у него нет намеренно", () => {
    // Обратная сторона того же обещания: появись у него имя, потребитель начал бы за него
    // цепляться, а мы обещали бы то, что решает не зона (`src/slot.tsx`).
    const slot = sources.find((source) => source.name === "slot.tsx");

    expect(slot?.slots).toEqual([]);
  });
});
