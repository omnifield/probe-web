import {
  Arrow as KobalteArrow,
  CheckboxItem as KobalteCheckboxItem,
  Content as KobalteContent,
  Group as KobalteGroup,
  GroupLabel as KobalteGroupLabel,
  Icon as KobalteIcon,
  Item as KobalteItem,
  ItemDescription as KobalteItemDescription,
  ItemIndicator as KobalteItemIndicator,
  ItemLabel as KobalteItemLabel,
  Menu as KobalteMenu,
  type MenubarArrowProps,
  type MenubarCheckboxItemProps,
  type MenubarContentProps,
  type MenubarGroupLabelProps,
  type MenubarGroupProps,
  type MenubarIconProps,
  type MenubarItemDescriptionProps,
  type MenubarItemIndicatorProps,
  type MenubarItemLabelProps,
  type MenubarItemProps,
  type MenubarMenuProps,
  type MenubarPortalProps,
  type MenubarRadioGroupProps,
  type MenubarRadioItemProps,
  type MenubarRootProps,
  type MenubarSeparatorProps,
  type MenubarSubContentProps,
  type MenubarSubProps,
  type MenubarSubTriggerProps,
  type MenubarTriggerProps,
  Portal as KobaltePortal,
  RadioGroup as KobalteRadioGroup,
  RadioItem as KobalteRadioItem,
  Root as KobalteMenubar,
  Separator as KobalteSeparator,
  Sub as KobalteSub,
  SubContent as KobalteSubContent,
  SubTrigger as KobalteSubTrigger,
  Trigger as KobalteTrigger,
} from "@kobalte/core/menubar";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Строка меню приложения: «Файл — Правка — Вид», как в настольной программе.
//
// ## Чем это отличается от НЕСКОЛЬКИХ выпадающих меню в ряд
//
// Поведением, и различие видно сразу: в строке меню достаточно открыть ОДНО, а дальше
// наведение мышью на соседний заголовок переключает меню без клика, и стрелки ходят между
// заголовками. Три независимых `DropdownMenu` так не умеют — каждое из них про себя.
//
// Отсюда лишняя часть, которой нет у выпадающего меню: `MenubarMenu` — обёртка ОДНОГО меню
// внутри строки. Своего узла она не рендерит и зацепки не несёт: это контекст, а не элемент.
//
// Остальные части те же, что у `DropdownMenu`, и имена построены так же.

/**
 * Пропсы `Menubar` — корня строки.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarRootProps<T>
>;

/**
 * Корень строки меню — ОДИН узел `[role=menubar]` плюс контекст.
 *
 * @example
 * ```tsx
 * <Menubar>
 *   <MenubarMenu>
 *     <MenubarTrigger>Файл</MenubarTrigger>
 *     <MenubarPortal>
 *       <MenubarContent>
 *         <MenubarItem onSelect={save}>Сохранить</MenubarItem>
 *       </MenubarContent>
 *     </MenubarPortal>
 *   </MenubarMenu>
 * </Menubar>
 * ```
 */
export function Menubar<T extends ValidComponent = "div">(props: MenubarProps<T>) {
  traceLife("ui.menubar");

  return <KobalteMenubar data-slot="menubar" {...(props as MenubarRootProps)} />;
}

/** Одно меню строки — узла НЕ рендерит, заводит контекст и поток позиционирования. */
export function MenubarMenu(props: MenubarMenuProps) {
  traceLife("ui.menubar-menu");

  return <KobalteMenu {...props} />;
}

/**
 * Пропсы `MenubarTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type MenubarTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  MenubarTriggerProps<T>
>;

/** Заголовок меню в строке — ОДИН узел `<button>`. */
export function MenubarTrigger<T extends ValidComponent = "button">(
  props: MenubarTriggerComponentProps<T>,
) {
  traceLife("ui.menubar-trigger");

  return <KobalteTrigger data-slot="menubar-trigger" {...(props as MenubarTriggerProps)} />;
}

/** Портал панели — узла НЕ рендерит. */
export function MenubarPortal(props: MenubarPortalProps) {
  traceLife("ui.menubar-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `MenubarContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarContentProps<T>
>;

/** Панель меню — то же отступление от 1-to-1, что у всего всплывающего. */
export function MenubarContent<T extends ValidComponent = "div">(
  props: MenubarContentComponentProps<T>,
) {
  traceLife("ui.menubar-content");

  return <KobalteContent data-slot="menubar-content" {...(props as MenubarContentProps)} />;
}

/**
 * Пропсы `MenubarArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarArrowProps<T>
>;

/** Стрелка-указатель — та же механика, что у `PopoverArrow`. */
export function MenubarArrow<T extends ValidComponent = "div">(
  props: MenubarArrowComponentProps<T>,
) {
  traceLife("ui.menubar-arrow");

  return <KobalteArrow data-slot="menubar-arrow" {...(props as MenubarArrowProps)} />;
}

/**
 * Пропсы `MenubarItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarItemComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarItemProps<T>
>;

/** Обычный пункт — ОДИН узел `[role=menuitem]`; действие приходит в `onSelect`. */
export function MenubarItem<T extends ValidComponent = "div">(
  props: MenubarItemComponentProps<T>,
) {
  traceLife("ui.menubar-item");

  return <KobalteItem data-slot="menubar-item" {...(props as MenubarItemProps)} />;
}

/**
 * Пропсы `MenubarItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarItemLabelComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarItemLabelProps<T>
>;

/** Подпись пункта — ОДИН узел; уходит в имя пункта. */
export function MenubarItemLabel<T extends ValidComponent = "div">(
  props: MenubarItemLabelComponentProps<T>,
) {
  traceLife("ui.menubar-item-label");

  return <KobalteItemLabel data-slot="menubar-item-label" {...(props as MenubarItemLabelProps)} />;
}

/**
 * Пропсы `MenubarItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, MenubarItemDescriptionProps<T>>;

/** Пояснение к пункту — ОДИН узел; здесь обычно живёт горячая клавиша. */
export function MenubarItemDescription<T extends ValidComponent = "div">(
  props: MenubarItemDescriptionComponentProps<T>,
) {
  traceLife("ui.menubar-item-description");

  return (
    <KobalteItemDescription
      data-slot="menubar-item-description"
      {...(props as MenubarItemDescriptionProps)}
    />
  );
}

/**
 * Пропсы `MenubarItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, MenubarItemIndicatorProps<T>>;

/** Отметка выбранного пункта — ОДИН узел, только во включённом состоянии. */
export function MenubarItemIndicator<T extends ValidComponent = "div">(
  props: MenubarItemIndicatorComponentProps<T>,
) {
  traceLife("ui.menubar-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="menubar-item-indicator"
      {...(props as MenubarItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `MenubarCheckboxItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarCheckboxItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, MenubarCheckboxItemProps<T>>;

/** Пункт-флажок — ОДИН узел `[role=menuitemcheckbox]`. */
export function MenubarCheckboxItem<T extends ValidComponent = "div">(
  props: MenubarCheckboxItemComponentProps<T>,
) {
  traceLife("ui.menubar-checkbox-item");

  return (
    <KobalteCheckboxItem
      data-slot="menubar-checkbox-item"
      {...(props as MenubarCheckboxItemProps)}
    />
  );
}

/**
 * Пропсы `MenubarRadioGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarRadioGroupComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarRadioGroupProps<T>
>;

/** Группа пунктов-переключателей — ОДИН узел. */
export function MenubarRadioGroup<T extends ValidComponent = "div">(
  props: MenubarRadioGroupComponentProps<T>,
) {
  traceLife("ui.menubar-radio-group");

  return (
    <KobalteRadioGroup data-slot="menubar-radio-group" {...(props as MenubarRadioGroupProps)} />
  );
}

/**
 * Пропсы `MenubarRadioItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarRadioItemComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarRadioItemProps<T>
>;

/** Пункт-переключатель — ОДИН узел `[role=menuitemradio]`. */
export function MenubarRadioItem<T extends ValidComponent = "div">(
  props: MenubarRadioItemComponentProps<T>,
) {
  traceLife("ui.menubar-radio-item");

  return <KobalteRadioItem data-slot="menubar-radio-item" {...(props as MenubarRadioItemProps)} />;
}

/**
 * Пропсы `MenubarGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarGroupComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarGroupProps<T>
>;

/** Группа пунктов — ОДИН узел `[role=group]`. */
export function MenubarGroup<T extends ValidComponent = "div">(
  props: MenubarGroupComponentProps<T>,
) {
  traceLife("ui.menubar-group");

  return <KobalteGroup data-slot="menubar-group" {...(props as MenubarGroupProps)} />;
}

/**
 * Пропсы `MenubarGroupLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type MenubarGroupLabelComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  MenubarGroupLabelProps<T>
>;

/** Подпись группы — ОДИН узел `<span>`. */
export function MenubarGroupLabel<T extends ValidComponent = "span">(
  props: MenubarGroupLabelComponentProps<T>,
) {
  traceLife("ui.menubar-group-label");

  return (
    <KobalteGroupLabel data-slot="menubar-group-label" {...(props as MenubarGroupLabelProps)} />
  );
}

/**
 * Пропсы `MenubarSeparator`.
 *
 * @typeParam T — что рендерить. По умолчанию `hr`.
 */
export type MenubarSeparatorComponentProps<T extends ValidComponent = "hr"> = PolymorphicProps<
  T,
  MenubarSeparatorProps<T>
>;

/** Разделитель пунктов — ОДИН узел `<hr>`. */
export function MenubarSeparator<T extends ValidComponent = "hr">(
  props: MenubarSeparatorComponentProps<T>,
) {
  traceLife("ui.menubar-separator");

  return <KobalteSeparator data-slot="menubar-separator" {...(props as MenubarSeparatorProps)} />;
}

/**
 * Пропсы `MenubarIcon`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type MenubarIconComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  MenubarIconProps<T>
>;

/** Место под иконку — ОДИН узел `<span aria-hidden>`. */
export function MenubarIcon<T extends ValidComponent = "span">(
  props: MenubarIconComponentProps<T>,
) {
  traceLife("ui.menubar-icon");

  return <KobalteIcon data-slot="menubar-icon" {...(props as MenubarIconProps)} />;
}

/** Пропсы `MenubarSub` — подменю. */
export type MenubarSubComponentProps = MenubarSubProps;

/** Подменю — узла НЕ рендерит. */
export function MenubarSub(props: MenubarSubComponentProps) {
  traceLife("ui.menubar-sub");

  return <KobalteSub {...props} />;
}

/**
 * Пропсы `MenubarSubTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarSubTriggerComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarSubTriggerProps<T>
>;

/** Пункт, открывающий подменю, — ОДИН узел со своей зацепкой. */
export function MenubarSubTrigger<T extends ValidComponent = "div">(
  props: MenubarSubTriggerComponentProps<T>,
) {
  traceLife("ui.menubar-sub-trigger");

  return (
    <KobalteSubTrigger data-slot="menubar-sub-trigger" {...(props as MenubarSubTriggerProps)} />
  );
}

/**
 * Пропсы `MenubarSubContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type MenubarSubContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  MenubarSubContentProps<T>
>;

/** Панель подменю — ОДИН узел внутри своего позиционера. */
export function MenubarSubContent<T extends ValidComponent = "div">(
  props: MenubarSubContentComponentProps<T>,
) {
  traceLife("ui.menubar-sub-content");

  return (
    <KobalteSubContent data-slot="menubar-sub-content" {...(props as MenubarSubContentProps)} />
  );
}
