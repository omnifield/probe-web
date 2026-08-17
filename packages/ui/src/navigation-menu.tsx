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
  type NavigationMenuArrowProps,
  type NavigationMenuCheckboxItemProps,
  type NavigationMenuContentProps,
  type NavigationMenuGroupLabelProps,
  type NavigationMenuGroupProps,
  type NavigationMenuIconProps,
  type NavigationMenuItemDescriptionProps,
  type NavigationMenuItemIndicatorProps,
  type NavigationMenuItemLabelProps,
  type NavigationMenuItemProps,
  type NavigationMenuMenuProps,
  type NavigationMenuPortalProps,
  type NavigationMenuRadioGroupProps,
  type NavigationMenuRadioItemProps,
  type NavigationMenuRootProps,
  type NavigationMenuSeparatorProps,
  type NavigationMenuSubContentProps,
  type NavigationMenuSubProps,
  type NavigationMenuSubTriggerProps,
  type NavigationMenuTriggerProps,
  type NavigationMenuViewportProps,
  Portal as KobaltePortal,
  RadioGroup as KobalteRadioGroup,
  RadioItem as KobalteRadioItem,
  Root as KobalteNavigationMenu,
  Separator as KobalteSeparator,
  Sub as KobalteSub,
  SubContent as KobalteSubContent,
  SubTrigger as KobalteSubTrigger,
  Trigger as KobalteTrigger,
  Viewport as KobalteViewport,
} from "@kobalte/core/navigation-menu";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Главное меню сайта: разделы с раскрывающимися панелями («Продукты», «Решения», «Цены»).
//
// ## Чем это отличается от `Menubar` и почему у него есть окно-приёмник
//
// В строке меню каждое меню всплывает СВОЕЙ панелью. В навигации панель ОДНА — она стоит под
// строкой разделов и меняет содержимое при переходе между ними, вместе с размером. Ради этого
// у навигации есть часть, которой больше нет нигде: `NavigationMenuViewport` — то самое окно, в
// которое переезжает содержимое раздела.
//
// Размеры содержимого kobalte отдаёт переменными CSS, а анимацию перехода между разделами
// пишет оформление. Кит и здесь ничего не рисует.
//
// ## Разметка списком — это не украшение
//
// Корень рендерит `<ul>`, окно-приёмник — `<li>`, а пункт панели — `<a>`. Навигация сайта это
// список ссылок, и вспомогательная техника читает её именно так.

/**
 * Пропсы `NavigationMenu` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `ul`.
 */
export type NavigationMenuProps<T extends ValidComponent = "ul"> = PolymorphicProps<
  T,
  NavigationMenuRootProps<T>
>;

/**
 * Корень навигации — ОДИН узел `<ul>` плюс контекст.
 *
 * @example
 * ```tsx
 * <NavigationMenu>
 *   <NavigationMenuMenu>
 *     <NavigationMenuTrigger>Продукты</NavigationMenuTrigger>
 *     <NavigationMenuPortal>
 *       <NavigationMenuContent>
 *         <NavigationMenuItem href="/tables">Таблицы</NavigationMenuItem>
 *       </NavigationMenuContent>
 *     </NavigationMenuPortal>
 *   </NavigationMenuMenu>
 *   <NavigationMenuViewport />
 * </NavigationMenu>
 * ```
 */
export function NavigationMenu<T extends ValidComponent = "ul">(props: NavigationMenuProps<T>) {
  traceLife("ui.navigation-menu");

  return (
    <KobalteNavigationMenu data-slot="navigation-menu" {...(props as NavigationMenuRootProps)} />
  );
}

/** Один раздел навигации — узла НЕ рендерит, заводит контекст. */
export function NavigationMenuMenu(props: NavigationMenuMenuProps) {
  traceLife("ui.navigation-menu-menu");

  return <KobalteMenu {...props} />;
}

/**
 * Пропсы `NavigationMenuTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type NavigationMenuTriggerComponentProps<T extends ValidComponent = "button"> =
  PolymorphicProps<T, NavigationMenuTriggerProps<T>>;

/** Заголовок раздела — ОДИН узел `<button>`. */
export function NavigationMenuTrigger<T extends ValidComponent = "button">(
  props: NavigationMenuTriggerComponentProps<T>,
) {
  traceLife("ui.navigation-menu-trigger");

  return (
    <KobalteTrigger data-slot="navigation-menu-trigger" {...(props as NavigationMenuTriggerProps)} />
  );
}

/** Портал панели — узла НЕ рендерит. */
export function NavigationMenuPortal(props: NavigationMenuPortalProps) {
  traceLife("ui.navigation-menu-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `NavigationMenuViewport`.
 *
 * @typeParam T — что рендерить. По умолчанию `li`.
 */
export type NavigationMenuViewportComponentProps<T extends ValidComponent = "li"> =
  PolymorphicProps<T, NavigationMenuViewportProps<T>>;

/**
 * Окно-приёмник — ОДИН узел `<li>`, в который переезжает панель активного раздела.
 *
 * Часть, которой нет ни у одного другого меню зоны. Размеры содержимого kobalte отдаёт
 * переменными CSS — переход между разделами (движение и изменение размера) пишет оформление.
 */
export function NavigationMenuViewport<T extends ValidComponent = "li">(
  props: NavigationMenuViewportComponentProps<T>,
) {
  traceLife("ui.navigation-menu-viewport");

  return (
    <KobalteViewport
      data-slot="navigation-menu-viewport"
      {...(props as NavigationMenuViewportProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `ul`.
 */
export type NavigationMenuContentComponentProps<T extends ValidComponent = "ul"> =
  PolymorphicProps<T, NavigationMenuContentProps<T>>;

/** Панель раздела — ОДИН узел `<ul>`; переезжает в окно-приёмник. */
export function NavigationMenuContent<T extends ValidComponent = "ul">(
  props: NavigationMenuContentComponentProps<T>,
) {
  traceLife("ui.navigation-menu-content");

  return (
    <KobalteContent data-slot="navigation-menu-content" {...(props as NavigationMenuContentProps)} />
  );
}

/**
 * Пропсы `NavigationMenuArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  NavigationMenuArrowProps<T>
>;

/** Стрелка-указатель — та же механика, что у `PopoverArrow`. */
export function NavigationMenuArrow<T extends ValidComponent = "div">(
  props: NavigationMenuArrowComponentProps<T>,
) {
  traceLife("ui.navigation-menu-arrow");

  return (
    <KobalteArrow data-slot="navigation-menu-arrow" {...(props as NavigationMenuArrowProps)} />
  );
}

/**
 * Пропсы `NavigationMenuItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `a`.
 */
export type NavigationMenuItemComponentProps<T extends ValidComponent = "a"> = PolymorphicProps<
  T,
  NavigationMenuItemProps<T>
>;

/** Пункт панели — ОДИН узел `<a>`: навигация это ссылки, а не кнопки. */
export function NavigationMenuItem<T extends ValidComponent = "a">(
  props: NavigationMenuItemComponentProps<T>,
) {
  traceLife("ui.navigation-menu-item");

  return <KobalteItem data-slot="navigation-menu-item" {...(props as NavigationMenuItemProps)} />;
}

/**
 * Пропсы `NavigationMenuItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuItemLabelComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuItemLabelProps<T>>;

/** Подпись пункта — ОДИН узел. */
export function NavigationMenuItemLabel<T extends ValidComponent = "div">(
  props: NavigationMenuItemLabelComponentProps<T>,
) {
  traceLife("ui.navigation-menu-item-label");

  return (
    <KobalteItemLabel
      data-slot="navigation-menu-item-label"
      {...(props as NavigationMenuItemLabelProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuItemDescriptionProps<T>>;

/** Пояснение к пункту — ОДИН узел; в навигации здесь обычно живёт краткое описание раздела. */
export function NavigationMenuItemDescription<T extends ValidComponent = "div">(
  props: NavigationMenuItemDescriptionComponentProps<T>,
) {
  traceLife("ui.navigation-menu-item-description");

  return (
    <KobalteItemDescription
      data-slot="navigation-menu-item-description"
      {...(props as NavigationMenuItemDescriptionProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuItemIndicatorProps<T>>;

/** Отметка выбранного пункта — ОДИН узел, только во включённом состоянии. */
export function NavigationMenuItemIndicator<T extends ValidComponent = "div">(
  props: NavigationMenuItemIndicatorComponentProps<T>,
) {
  traceLife("ui.navigation-menu-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="navigation-menu-item-indicator"
      {...(props as NavigationMenuItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuCheckboxItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuCheckboxItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuCheckboxItemProps<T>>;

/** Пункт-флажок — ОДИН узел `[role=menuitemcheckbox]`. */
export function NavigationMenuCheckboxItem<T extends ValidComponent = "div">(
  props: NavigationMenuCheckboxItemComponentProps<T>,
) {
  traceLife("ui.navigation-menu-checkbox-item");

  return (
    <KobalteCheckboxItem
      data-slot="navigation-menu-checkbox-item"
      {...(props as NavigationMenuCheckboxItemProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuRadioGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuRadioGroupComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuRadioGroupProps<T>>;

/** Группа пунктов-переключателей — ОДИН узел. */
export function NavigationMenuRadioGroup<T extends ValidComponent = "div">(
  props: NavigationMenuRadioGroupComponentProps<T>,
) {
  traceLife("ui.navigation-menu-radio-group");

  return (
    <KobalteRadioGroup
      data-slot="navigation-menu-radio-group"
      {...(props as NavigationMenuRadioGroupProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuRadioItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuRadioItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuRadioItemProps<T>>;

/** Пункт-переключатель — ОДИН узел `[role=menuitemradio]`. */
export function NavigationMenuRadioItem<T extends ValidComponent = "div">(
  props: NavigationMenuRadioItemComponentProps<T>,
) {
  traceLife("ui.navigation-menu-radio-item");

  return (
    <KobalteRadioItem
      data-slot="navigation-menu-radio-item"
      {...(props as NavigationMenuRadioItemProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuGroupComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  NavigationMenuGroupProps<T>
>;

/** Группа пунктов — ОДИН узел `[role=group]`. */
export function NavigationMenuGroup<T extends ValidComponent = "div">(
  props: NavigationMenuGroupComponentProps<T>,
) {
  traceLife("ui.navigation-menu-group");

  return (
    <KobalteGroup data-slot="navigation-menu-group" {...(props as NavigationMenuGroupProps)} />
  );
}

/**
 * Пропсы `NavigationMenuGroupLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type NavigationMenuGroupLabelComponentProps<T extends ValidComponent = "span"> =
  PolymorphicProps<T, NavigationMenuGroupLabelProps<T>>;

/** Подпись группы — ОДИН узел `<span>`. */
export function NavigationMenuGroupLabel<T extends ValidComponent = "span">(
  props: NavigationMenuGroupLabelComponentProps<T>,
) {
  traceLife("ui.navigation-menu-group-label");

  return (
    <KobalteGroupLabel
      data-slot="navigation-menu-group-label"
      {...(props as NavigationMenuGroupLabelProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuSeparator`.
 *
 * @typeParam T — что рендерить. По умолчанию `hr`.
 */
export type NavigationMenuSeparatorComponentProps<T extends ValidComponent = "hr"> =
  PolymorphicProps<T, NavigationMenuSeparatorProps<T>>;

/** Разделитель пунктов — ОДИН узел `<hr>`. */
export function NavigationMenuSeparator<T extends ValidComponent = "hr">(
  props: NavigationMenuSeparatorComponentProps<T>,
) {
  traceLife("ui.navigation-menu-separator");

  return (
    <KobalteSeparator
      data-slot="navigation-menu-separator"
      {...(props as NavigationMenuSeparatorProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuIcon`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type NavigationMenuIconComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  NavigationMenuIconProps<T>
>;

/** Место под иконку — ОДИН узел `<span aria-hidden>`. */
export function NavigationMenuIcon<T extends ValidComponent = "span">(
  props: NavigationMenuIconComponentProps<T>,
) {
  traceLife("ui.navigation-menu-icon");

  return <KobalteIcon data-slot="navigation-menu-icon" {...(props as NavigationMenuIconProps)} />;
}

/** Пропсы `NavigationMenuSub` — подменю. */
export type NavigationMenuSubComponentProps = NavigationMenuSubProps;

/** Подменю — узла НЕ рендерит. */
export function NavigationMenuSub(props: NavigationMenuSubComponentProps) {
  traceLife("ui.navigation-menu-sub");

  return <KobalteSub {...props} />;
}

/**
 * Пропсы `NavigationMenuSubTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuSubTriggerComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuSubTriggerProps<T>>;

/** Пункт, открывающий подменю, — ОДИН узел со своей зацепкой. */
export function NavigationMenuSubTrigger<T extends ValidComponent = "div">(
  props: NavigationMenuSubTriggerComponentProps<T>,
) {
  traceLife("ui.navigation-menu-sub-trigger");

  return (
    <KobalteSubTrigger
      data-slot="navigation-menu-sub-trigger"
      {...(props as NavigationMenuSubTriggerProps)}
    />
  );
}

/**
 * Пропсы `NavigationMenuSubContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type NavigationMenuSubContentComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, NavigationMenuSubContentProps<T>>;

/** Панель подменю — ОДИН узел внутри своего позиционера. */
export function NavigationMenuSubContent<T extends ValidComponent = "div">(
  props: NavigationMenuSubContentComponentProps<T>,
) {
  traceLife("ui.navigation-menu-sub-content");

  return (
    <KobalteSubContent
      data-slot="navigation-menu-sub-content"
      {...(props as NavigationMenuSubContentProps)}
    />
  );
}
