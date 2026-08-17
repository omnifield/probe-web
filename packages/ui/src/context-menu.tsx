import {
  Arrow as KobalteArrow,
  CheckboxItem as KobalteCheckboxItem,
  Content as KobalteContent,
  type ContextMenuArrowProps,
  type ContextMenuCheckboxItemProps,
  type ContextMenuContentProps,
  type ContextMenuGroupLabelProps,
  type ContextMenuGroupProps,
  type ContextMenuIconProps,
  type ContextMenuItemDescriptionProps,
  type ContextMenuItemIndicatorProps,
  type ContextMenuItemLabelProps,
  type ContextMenuItemProps,
  type ContextMenuPortalProps,
  type ContextMenuRadioGroupProps,
  type ContextMenuRadioItemProps,
  type ContextMenuRootProps,
  type ContextMenuSeparatorProps,
  type ContextMenuSubContentProps,
  type ContextMenuSubProps,
  type ContextMenuSubTriggerProps,
  type ContextMenuTriggerProps,
  Group as KobalteGroup,
  GroupLabel as KobalteGroupLabel,
  Icon as KobalteIcon,
  Item as KobalteItem,
  ItemDescription as KobalteItemDescription,
  ItemIndicator as KobalteItemIndicator,
  ItemLabel as KobalteItemLabel,
  Portal as KobaltePortal,
  RadioGroup as KobalteRadioGroup,
  RadioItem as KobalteRadioItem,
  Root as KobalteContextMenu,
  Separator as KobalteSeparator,
  Sub as KobalteSub,
  SubContent as KobalteSubContent,
  SubTrigger as KobalteSubTrigger,
  Trigger as KobalteTrigger,
} from "@kobalte/core/context-menu";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Меню по правому клику: строка таблицы, точка на карте, узел дерева.
//
// ## То же меню, что и `DropdownMenu`, но открывается иначе — и это меняет две вещи
//
// Части один в один совпадают с выпадающим меню (те же пункты, группы, подменю), поэтому и
// имена зацепок построены так же. Разного — ровно два:
//
//   • **Зацепка — это область, а не кнопка.** `ContextMenuTrigger` оборачивает то, по чему
//     кликают правой кнопкой: строку, ячейку, участок карты. Она рендерит СВОЙ узел (`div` по
//     умолчанию), и его видно — в отличие от кнопки выпадающего меню, которая уже была в
//     разметке.
//   • **Позиция — от УКАЗАТЕЛЯ, а не от узла.** Меню встаёт там, где щёлкнули, поэтому
//     `placement` и `gutter` здесь не работают: считать не от чего.
//
// Своя зацепка (`context-menu-*`, а не `dropdown-menu-*`) нужна ровно поэтому: одинаково
// выглядящие меню оформляются по-разному, когда одно висит под кнопкой, а другое — под курсором.

/** Пропсы `ContextMenu` — корня. */
export type ContextMenuProps = ContextMenuRootProps;

/**
 * Корень — узла НЕ рендерит, заводит контекст.
 *
 * @example
 * ```tsx
 * <ContextMenu>
 *   <ContextMenuTrigger>{строка}</ContextMenuTrigger>
 *   <ContextMenuPortal>
 *     <ContextMenuContent>
 *       <ContextMenuItem onSelect={remove}>Удалить</ContextMenuItem>
 *     </ContextMenuContent>
 *   </ContextMenuPortal>
 * </ContextMenu>
 * ```
 */
export function ContextMenu(props: ContextMenuProps) {
  traceLife("ui.context-menu");

  return <KobalteContextMenu {...props} />;
}

/**
 * Пропсы `ContextMenuTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuTriggerComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ContextMenuTriggerProps<T>
>;

/** Область, по которой щёлкают правой кнопкой, — ОДИН узел вокруг содержимого. */
export function ContextMenuTrigger<T extends ValidComponent = "div">(
  props: ContextMenuTriggerComponentProps<T>,
) {
  traceLife("ui.context-menu-trigger");

  return <KobalteTrigger data-slot="context-menu-trigger" {...(props as ContextMenuTriggerProps)} />;
}

/** Портал меню — узла НЕ рендерит. */
export function ContextMenuPortal(props: ContextMenuPortalProps) {
  traceLife("ui.context-menu-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `ContextMenuContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ContextMenuContentProps<T>
>;

/** Панель меню — то же отступление от 1-to-1, что у всего всплывающего. */
export function ContextMenuContent<T extends ValidComponent = "div">(
  props: ContextMenuContentComponentProps<T>,
) {
  traceLife("ui.context-menu-content");

  return <KobalteContent data-slot="context-menu-content" {...(props as ContextMenuContentProps)} />;
}

/**
 * Пропсы `ContextMenuArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ContextMenuArrowProps<T>
>;

/** Стрелка-указатель — та же механика, что у `PopoverArrow`. */
export function ContextMenuArrow<T extends ValidComponent = "div">(
  props: ContextMenuArrowComponentProps<T>,
) {
  traceLife("ui.context-menu-arrow");

  return <KobalteArrow data-slot="context-menu-arrow" {...(props as ContextMenuArrowProps)} />;
}

/**
 * Пропсы `ContextMenuItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuItemComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ContextMenuItemProps<T>
>;

/** Обычный пункт — ОДИН узел `[role=menuitem]`; действие приходит в `onSelect`. */
export function ContextMenuItem<T extends ValidComponent = "div">(
  props: ContextMenuItemComponentProps<T>,
) {
  traceLife("ui.context-menu-item");

  return <KobalteItem data-slot="context-menu-item" {...(props as ContextMenuItemProps)} />;
}

/**
 * Пропсы `ContextMenuItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuItemLabelComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuItemLabelProps<T>>;

/** Подпись пункта — ОДИН узел; уходит в имя пункта. */
export function ContextMenuItemLabel<T extends ValidComponent = "div">(
  props: ContextMenuItemLabelComponentProps<T>,
) {
  traceLife("ui.context-menu-item-label");

  return (
    <KobalteItemLabel data-slot="context-menu-item-label" {...(props as ContextMenuItemLabelProps)} />
  );
}

/**
 * Пропсы `ContextMenuItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuItemDescriptionProps<T>>;

/** Пояснение к пункту — ОДИН узел. */
export function ContextMenuItemDescription<T extends ValidComponent = "div">(
  props: ContextMenuItemDescriptionComponentProps<T>,
) {
  traceLife("ui.context-menu-item-description");

  return (
    <KobalteItemDescription
      data-slot="context-menu-item-description"
      {...(props as ContextMenuItemDescriptionProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuItemIndicatorProps<T>>;

/** Отметка выбранного пункта — ОДИН узел, только во включённом состоянии. */
export function ContextMenuItemIndicator<T extends ValidComponent = "div">(
  props: ContextMenuItemIndicatorComponentProps<T>,
) {
  traceLife("ui.context-menu-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="context-menu-item-indicator"
      {...(props as ContextMenuItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuCheckboxItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuCheckboxItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuCheckboxItemProps<T>>;

/** Пункт-флажок — ОДИН узел `[role=menuitemcheckbox]`. */
export function ContextMenuCheckboxItem<T extends ValidComponent = "div">(
  props: ContextMenuCheckboxItemComponentProps<T>,
) {
  traceLife("ui.context-menu-checkbox-item");

  return (
    <KobalteCheckboxItem
      data-slot="context-menu-checkbox-item"
      {...(props as ContextMenuCheckboxItemProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuRadioGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuRadioGroupComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuRadioGroupProps<T>>;

/** Группа пунктов-переключателей — ОДИН узел; держит значение группы. */
export function ContextMenuRadioGroup<T extends ValidComponent = "div">(
  props: ContextMenuRadioGroupComponentProps<T>,
) {
  traceLife("ui.context-menu-radio-group");

  return (
    <KobalteRadioGroup
      data-slot="context-menu-radio-group"
      {...(props as ContextMenuRadioGroupProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuRadioItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuRadioItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuRadioItemProps<T>>;

/** Пункт-переключатель — ОДИН узел `[role=menuitemradio]`. */
export function ContextMenuRadioItem<T extends ValidComponent = "div">(
  props: ContextMenuRadioItemComponentProps<T>,
) {
  traceLife("ui.context-menu-radio-item");

  return (
    <KobalteRadioItem
      data-slot="context-menu-radio-item"
      {...(props as ContextMenuRadioItemProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuGroupComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ContextMenuGroupProps<T>
>;

/** Группа пунктов — ОДИН узел `[role=group]`. */
export function ContextMenuGroup<T extends ValidComponent = "div">(
  props: ContextMenuGroupComponentProps<T>,
) {
  traceLife("ui.context-menu-group");

  return <KobalteGroup data-slot="context-menu-group" {...(props as ContextMenuGroupProps)} />;
}

/**
 * Пропсы `ContextMenuGroupLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ContextMenuGroupLabelComponentProps<T extends ValidComponent = "span"> =
  PolymorphicProps<T, ContextMenuGroupLabelProps<T>>;

/** Подпись группы — ОДИН узел `<span>`; уходит в `aria-labelledby` группы. */
export function ContextMenuGroupLabel<T extends ValidComponent = "span">(
  props: ContextMenuGroupLabelComponentProps<T>,
) {
  traceLife("ui.context-menu-group-label");

  return (
    <KobalteGroupLabel
      data-slot="context-menu-group-label"
      {...(props as ContextMenuGroupLabelProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuSeparator`.
 *
 * @typeParam T — что рендерить. По умолчанию `hr`.
 */
export type ContextMenuSeparatorComponentProps<T extends ValidComponent = "hr"> =
  PolymorphicProps<T, ContextMenuSeparatorProps<T>>;

/** Разделитель пунктов — ОДИН узел `<hr>`; своя зацепка, как и у выпадающего меню. */
export function ContextMenuSeparator<T extends ValidComponent = "hr">(
  props: ContextMenuSeparatorComponentProps<T>,
) {
  traceLife("ui.context-menu-separator");

  return (
    <KobalteSeparator
      data-slot="context-menu-separator"
      {...(props as ContextMenuSeparatorProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuIcon`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ContextMenuIconComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ContextMenuIconProps<T>
>;

/** Место под иконку — ОДИН узел `<span aria-hidden>`. */
export function ContextMenuIcon<T extends ValidComponent = "span">(
  props: ContextMenuIconComponentProps<T>,
) {
  traceLife("ui.context-menu-icon");

  return <KobalteIcon data-slot="context-menu-icon" {...(props as ContextMenuIconProps)} />;
}

/** Пропсы `ContextMenuSub` — подменю. */
export type ContextMenuSubComponentProps = ContextMenuSubProps;

/** Подменю — узла НЕ рендерит; заводит свой контекст и направление раскрытия. */
export function ContextMenuSub(props: ContextMenuSubComponentProps) {
  traceLife("ui.context-menu-sub");

  return <KobalteSub {...props} />;
}

/**
 * Пропсы `ContextMenuSubTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuSubTriggerComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuSubTriggerProps<T>>;

/** Пункт, открывающий подменю, — ОДИН узел; зацепка своя, он открывает, а не выполняет. */
export function ContextMenuSubTrigger<T extends ValidComponent = "div">(
  props: ContextMenuSubTriggerComponentProps<T>,
) {
  traceLife("ui.context-menu-sub-trigger");

  return (
    <KobalteSubTrigger
      data-slot="context-menu-sub-trigger"
      {...(props as ContextMenuSubTriggerProps)}
    />
  );
}

/**
 * Пропсы `ContextMenuSubContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ContextMenuSubContentComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ContextMenuSubContentProps<T>>;

/** Панель подменю — ОДИН узел внутри своего позиционера. */
export function ContextMenuSubContent<T extends ValidComponent = "div">(
  props: ContextMenuSubContentComponentProps<T>,
) {
  traceLife("ui.context-menu-sub-content");

  return (
    <KobalteSubContent
      data-slot="context-menu-sub-content"
      {...(props as ContextMenuSubContentProps)}
    />
  );
}
