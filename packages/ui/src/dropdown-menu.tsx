import {
  Arrow as KobalteArrow,
  CheckboxItem as KobalteCheckboxItem,
  Content as KobalteContent,
  type DropdownMenuArrowProps,
  type DropdownMenuCheckboxItemProps,
  type DropdownMenuContentProps,
  type DropdownMenuGroupLabelProps,
  type DropdownMenuGroupProps,
  type DropdownMenuIconProps,
  type DropdownMenuItemDescriptionProps,
  type DropdownMenuItemIndicatorProps,
  type DropdownMenuItemLabelProps,
  type DropdownMenuItemProps,
  type DropdownMenuPortalProps,
  type DropdownMenuRadioGroupProps,
  type DropdownMenuRadioItemProps,
  type DropdownMenuRootProps,
  type DropdownMenuSeparatorProps,
  type DropdownMenuSubContentProps,
  type DropdownMenuSubProps,
  type DropdownMenuSubTriggerProps,
  type DropdownMenuTriggerProps,
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
  Root as KobalteDropdownMenu,
  Separator as KobalteSeparator,
  Sub as KobalteSub,
  SubContent as KobalteSubContent,
  SubTrigger as KobalteSubTrigger,
  Trigger as KobalteTrigger,
} from "@kobalte/core/dropdown-menu";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useSlot, slotAware } from "./slot-chain.js";
import { traceLife } from "./trace.js";

// Меню действий: правка строки таблицы, настройки слоя карты, «ещё» в панели инструментов.
//
// ## Самое разложенное семейство зоны — девятнадцать частей
//
// Столько же, сколько у kobalte, и сокращать нечего: меню это не список строк, а набор РАЗНЫХ
// сущностей — обычный пункт, пункт-флажок, пункт-переключатель, группа, подпись группы,
// разделитель, подменю. Одеть их одним правилом нельзя, значит у каждого своя зацепка.
//
// Свести всё к «пункту с пропсами `checkable` и `checked`» — это тот самый компонент, который
// решает за потребителя разметку; ровно от этого зона и уходит.
//
// ## Узла нет у корня, портала и подменю
//
// `DropdownMenu`, `DropdownMenuPortal` и `DropdownMenuSub` заводят контекст и поток
// позиционирования, но в документ ничего не приводят — зацепок у них поэтому тоже нет.
// Панель ловится по `dropdown-menu-content`, подменю — по `dropdown-menu-sub-content`.
//
// ## Позиционирование — на корне, всплывающий стиль — как у `Popover`
//
// `placement`, `gutter`, `shift`, `flip` ставятся на `DropdownMenu`. Служебный инлайновый
// стиль панели и стрелки разобран в `src/popover.tsx` и в доке зоны: механика, не вид.

/** Пропсы `DropdownMenu` — корня: открытость, модальность и опции позиционировщика. */
export type DropdownMenuProps = DropdownMenuRootProps;

/**
 * Корень меню — узла НЕ рендерит, заводит контекст и поток позиционирования.
 *
 * @example
 * ```tsx
 * <DropdownMenu placement="bottom-end" gutter={4}>
 *   <DropdownMenuTrigger>Ещё</DropdownMenuTrigger>
 *   <DropdownMenuPortal>
 *     <DropdownMenuContent>
 *       <DropdownMenuItem onSelect={rename}>Переименовать</DropdownMenuItem>
 *       <DropdownMenuSeparator />
 *       <DropdownMenuItem onSelect={remove}>Удалить</DropdownMenuItem>
 *     </DropdownMenuContent>
 *   </DropdownMenuPortal>
 * </DropdownMenu>
 * ```
 */
export function DropdownMenu(props: DropdownMenuProps) {
  traceLife("ui.dropdown-menu");

  return <KobalteDropdownMenu {...props} />;
}

/**
 * Пропсы `DropdownMenuTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type DropdownMenuTriggerComponentProps<T extends ValidComponent = "button"> =
  PolymorphicProps<T, DropdownMenuTriggerProps<T>>;

/** Кнопка, открывающая меню, — ОДИН узел `<button>`; она же зацепка позиционирования. */
export const DropdownMenuTrigger = slotAware(function DropdownMenuTrigger<T extends ValidComponent = "button">(
  props: DropdownMenuTriggerComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-trigger");

  const [slot, rest] = useSlot(props, "dropdown-menu-trigger");

  return (
    <KobalteTrigger {...slot} {...(rest as DropdownMenuTriggerProps)} />
  );
});

/**
 * Пропсы `DropdownMenuIcon`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type DropdownMenuIconComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  DropdownMenuIconProps<T>
>;

/**
 * Место под стрелку в кнопке — ОДИН узел `<span aria-hidden>`.
 *
 * Саму иконку кладёт потребитель, как и в `SelectIcon`. Узел отдельный, потому что состояние
 * открытости приезжает на него атрибутом данных — по нему стрелку и поворачивают.
 */
export function DropdownMenuIcon<T extends ValidComponent = "span">(
  props: DropdownMenuIconComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-icon");

  return <KobalteIcon data-slot="dropdown-menu-icon" {...(props as DropdownMenuIconProps)} />;
}

/** Портал меню — узла НЕ рендерит, переносит содержимое в конец документа. */
export function DropdownMenuPortal(props: DropdownMenuPortalProps) {
  traceLife("ui.dropdown-menu-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `DropdownMenuContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  DropdownMenuContentProps<T>
>;

/**
 * Панель меню — то же отступление от 1-to-1, что у всего всплывающего: позиционер плюс панель
 * внутри него. Обоснование общее и разобрано в `src/popover.tsx`.
 */
export function DropdownMenuContent<T extends ValidComponent = "div">(
  props: DropdownMenuContentComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-content");

  return (
    <KobalteContent data-slot="dropdown-menu-content" {...(props as DropdownMenuContentProps)} />
  );
}

/**
 * Пропсы `DropdownMenuArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  DropdownMenuArrowProps<T>
>;

/** Стрелка-указатель — та же механика и те же два отступления, что у `PopoverArrow`. */
export function DropdownMenuArrow<T extends ValidComponent = "div">(
  props: DropdownMenuArrowComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-arrow");

  return <KobalteArrow data-slot="dropdown-menu-arrow" {...(props as DropdownMenuArrowProps)} />;
}

/**
 * Пропсы `DropdownMenuItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuItemComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  DropdownMenuItemProps<T>
>;

/**
 * Обычный пункт — ОДИН узел `[role=menuitem]`.
 *
 * Действие приходит в `onSelect`, а не в `onClick`: kobalte зовёт его и по клику, и по
 * `Enter`/`Space`, и закрывает меню сам. Обработчик потребителя при этом доезжает как есть.
 */
export function DropdownMenuItem<T extends ValidComponent = "div">(
  props: DropdownMenuItemComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-item");

  return <KobalteItem data-slot="dropdown-menu-item" {...(props as DropdownMenuItemProps)} />;
}

/**
 * Пропсы `DropdownMenuItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuItemLabelComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuItemLabelProps<T>>;

/**
 * Подпись пункта — ОДИН узел.
 *
 * Нужна, когда в пункте не только текст: иконка, горячая клавиша, пояснение. Тогда именно
 * подпись уходит в имя пункта для вспомогательной техники, а не всё его содержимое разом.
 */
export function DropdownMenuItemLabel<T extends ValidComponent = "div">(
  props: DropdownMenuItemLabelComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-item-label");

  return (
    <KobalteItemLabel
      data-slot="dropdown-menu-item-label"
      {...(props as DropdownMenuItemLabelProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuItemDescriptionProps<T>>;

/** Пояснение к пункту — ОДИН узел; уходит в `aria-describedby` пункта. */
export function DropdownMenuItemDescription<T extends ValidComponent = "div">(
  props: DropdownMenuItemDescriptionComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-item-description");

  return (
    <KobalteItemDescription
      data-slot="dropdown-menu-item-description"
      {...(props as DropdownMenuItemDescriptionProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuItemIndicatorProps<T>>;

/**
 * Отметка выбранного пункта-флажка или пункта-переключателя — ОДИН узел, который kobalte
 * рендерит ТОЛЬКО во включённом состоянии. Нужен узел всегда — `forceMount` насквозь.
 */
export function DropdownMenuItemIndicator<T extends ValidComponent = "div">(
  props: DropdownMenuItemIndicatorComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="dropdown-menu-item-indicator"
      {...(props as DropdownMenuItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuCheckboxItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuCheckboxItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuCheckboxItemProps<T>>;

/**
 * Пункт-флажок — ОДИН узел `[role=menuitemcheckbox]`.
 *
 * Отдельная часть, а не `Checkbox` внутри пункта: у пункта меню своя роль, своя навигация
 * стрелками и своё поведение при выборе. Вложенный флажок сломал бы и то и другое.
 */
export function DropdownMenuCheckboxItem<T extends ValidComponent = "div">(
  props: DropdownMenuCheckboxItemComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-checkbox-item");

  return (
    <KobalteCheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      {...(props as DropdownMenuCheckboxItemProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuRadioGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuRadioGroupComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuRadioGroupProps<T>>;

/** Группа пунктов-переключателей — ОДИН узел; держит значение группы. */
export function DropdownMenuRadioGroup<T extends ValidComponent = "div">(
  props: DropdownMenuRadioGroupComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-radio-group");

  return (
    <KobalteRadioGroup
      data-slot="dropdown-menu-radio-group"
      {...(props as DropdownMenuRadioGroupProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuRadioItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuRadioItemComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuRadioItemProps<T>>;

/** Пункт-переключатель — ОДИН узел `[role=menuitemradio]`. Обязателен проп `value`. */
export function DropdownMenuRadioItem<T extends ValidComponent = "div">(
  props: DropdownMenuRadioItemComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-radio-item");

  return (
    <KobalteRadioItem
      data-slot="dropdown-menu-radio-item"
      {...(props as DropdownMenuRadioItemProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuGroup`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuGroupComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  DropdownMenuGroupProps<T>
>;

/** Группа пунктов — ОДИН узел `[role=group]`; связывается со своей подписью. */
export function DropdownMenuGroup<T extends ValidComponent = "div">(
  props: DropdownMenuGroupComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-group");

  return <KobalteGroup data-slot="dropdown-menu-group" {...(props as DropdownMenuGroupProps)} />;
}

/**
 * Пропсы `DropdownMenuGroupLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type DropdownMenuGroupLabelComponentProps<T extends ValidComponent = "span"> =
  PolymorphicProps<T, DropdownMenuGroupLabelProps<T>>;

/**
 * Подпись группы — ОДИН узел `<span>`, уезжает в `aria-labelledby` группы.
 *
 * Не `<label>` по той же причине, что и `radio-group-label`: подпись относится к набору
 * пунктов, а не к одному управляющему элементу.
 */
export function DropdownMenuGroupLabel<T extends ValidComponent = "span">(
  props: DropdownMenuGroupLabelComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-group-label");

  return (
    <KobalteGroupLabel
      data-slot="dropdown-menu-group-label"
      {...(props as DropdownMenuGroupLabelProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuSeparator`.
 *
 * @typeParam T — что рендерить. По умолчанию `hr`.
 */
export type DropdownMenuSeparatorComponentProps<T extends ValidComponent = "hr"> =
  PolymorphicProps<T, DropdownMenuSeparatorProps<T>>;

/**
 * Разделитель пунктов — ОДИН узел `<hr>`.
 *
 * Своя зацепка, а не общий `separator` зоны: разделитель внутри меню и разделитель на
 * странице оформляются по-разному, и одно имя на двоих означало бы, что одно из двух
 * оформлений придётся отменять переопределением.
 */
export function DropdownMenuSeparator<T extends ValidComponent = "hr">(
  props: DropdownMenuSeparatorComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-separator");

  return (
    <KobalteSeparator
      data-slot="dropdown-menu-separator"
      {...(props as DropdownMenuSeparatorProps)}
    />
  );
}

/** Пропсы `DropdownMenuSub` — подменю: открытость и опции позиционировщика. */
export type DropdownMenuSubComponentProps = DropdownMenuSubProps;

/** Подменю — узла НЕ рендерит; ставит своё направление раскрытия и заводит свой контекст. */
export function DropdownMenuSub(props: DropdownMenuSubComponentProps) {
  traceLife("ui.dropdown-menu-sub");

  return <KobalteSub {...props} />;
}

/**
 * Пропсы `DropdownMenuSubTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuSubTriggerComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuSubTriggerProps<T>>;

/**
 * Пункт, открывающий подменю, — ОДИН узел.
 *
 * Зацепка своя, а не `dropdown-menu-item`: он открывает, а не выполняет, и оформляется иначе —
 * у него есть стрелка вбок и состояние раскрытости.
 */
export function DropdownMenuSubTrigger<T extends ValidComponent = "div">(
  props: DropdownMenuSubTriggerComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-sub-trigger");

  return (
    <KobalteSubTrigger
      data-slot="dropdown-menu-sub-trigger"
      {...(props as DropdownMenuSubTriggerProps)}
    />
  );
}

/**
 * Пропсы `DropdownMenuSubContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DropdownMenuSubContentComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, DropdownMenuSubContentProps<T>>;

/** Панель подменю — ОДИН узел внутри своего позиционера, как и всё всплывающее. */
export function DropdownMenuSubContent<T extends ValidComponent = "div">(
  props: DropdownMenuSubContentComponentProps<T>,
) {
  traceLife("ui.dropdown-menu-sub-content");

  return (
    <KobalteSubContent
      data-slot="dropdown-menu-sub-content"
      {...(props as DropdownMenuSubContentProps)}
    />
  );
}
