import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Content as KobalteContent,
  Icon as KobalteIcon,
  Item as KobalteItem,
  ItemIndicator as KobalteItemIndicator,
  ItemLabel as KobalteItemLabel,
  Listbox as KobalteListbox,
  Portal as KobaltePortal,
  Root as KobalteSelect,
  type SelectContentProps,
  type SelectIconProps,
  type SelectItemIndicatorProps,
  type SelectItemLabelProps,
  type SelectItemProps,
  type SelectListboxProps,
  type SelectPortalProps,
  type SelectRootProps,
  type SelectTriggerProps,
  type SelectValueProps,
  Trigger as KobalteTrigger,
  Value as KobalteValue,
} from "@kobalte/core/select";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Единственный СОСТАВНОЙ примитив волны. Правило 1-to-1 он не нарушает: узлов много, но
// каждая ЧАСТЬ рендерит ровно один — `Trigger` это `<button>`, `Content` это `<div>`,
// `Listbox` это `<ul>`, `Item` это `<li>`. Нарушением было бы обратное: один компонент
// `<Select options={…} />`, который рисует всю конструкцию сам.
//
// Оракул именно так и сделал — корень с пропсом `options`, а внутри жёстко зашитые триггер,
// иконка `ChevronDown` из `lucide-solid`, портал, две обёртки `overflow` под анимацию и
// галочка в индикаторе. Отсюда зависимость на пакет иконок, класс `select-content-animate`
// из чужого CSS и невозможность поменять разметку панели, не правя кит.
//
// Здесь наоборот: конструкцию собирает потребитель, а `options` + `itemComponent` остаются
// пропсами корня, потому что список у kobalte data-driven — это его контракт, не наш выбор.

/**
 * Пропсы корня `Select`.
 *
 * @typeParam Option — тип элемента списка.
 * @typeParam OptGroup — тип группы, если список сгруппирован.
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SelectProps<
  Option,
  OptGroup = never,
  T extends ValidComponent = "div",
> = PolymorphicProps<T, SelectRootProps<Option, OptGroup, T>>;

/**
 * Корень выпадающего списка — ОДИН узел `<div>` плюс контекст для частей.
 *
 * Держит `options`, `value`/`defaultValue`/`onChange`, `placeholder`, `itemComponent` и
 * состояние открытости; клавиатуру, фокус-ловушку, позиционирование и `aria-*` делает kobalte.
 *
 * @example
 * ```tsx
 * <Select
 *   options={["Москва", "Казань"]}
 *   placeholder="Город"
 *   itemComponent={(p) => (
 *     <SelectItem item={p.item}>
 *       <SelectItemLabel>{p.item.rawValue}</SelectItemLabel>
 *     </SelectItem>
 *   )}
 * >
 *   <SelectTrigger>
 *     <SelectValue<string>>{(s) => s.selectedOption()}</SelectValue>
 *   </SelectTrigger>
 *   <SelectPortal>
 *     <SelectContent>
 *       <SelectListbox />
 *     </SelectContent>
 *   </SelectPortal>
 * </Select>
 * ```
 */
export function Select<Option, OptGroup = never, T extends ValidComponent = "div">(
  props: SelectProps<Option, OptGroup, T>,
) {
  traceLife("ui.select");

  return <KobalteSelect data-slot="select" {...(props as SelectRootProps<Option, OptGroup>)} />;
}

/** Пропсы `SelectTrigger`. */
export type SelectTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  SelectTriggerProps<T>
>;

/** Кнопка, открывающая список, — ОДИН узел `<button>`. */
export function SelectTrigger<T extends ValidComponent = "button">(
  props: SelectTriggerComponentProps<T>,
) {
  traceLife("ui.select-trigger");

  return <KobalteTrigger data-slot="select-trigger" {...(props as SelectTriggerProps)} />;
}

/** Пропсы `SelectValue`. */
export type SelectValueComponentProps<
  Option,
  T extends ValidComponent = "span",
> = PolymorphicProps<T, SelectValueProps<Option, T>>;

/**
 * Выбранное значение внутри триггера — ОДИН узел `<span>`.
 *
 * Содержимое задаётся функцией-потомком, которой kobalte передаёт состояние выбора.
 */
export function SelectValue<Option, T extends ValidComponent = "span">(
  props: SelectValueComponentProps<Option, T>,
) {
  traceLife("ui.select-value");

  return <KobalteValue data-slot="select-value" {...(props as SelectValueProps<Option>)} />;
}

/** Пропсы `SelectIcon`. */
export type SelectIconComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  SelectIconProps<T>
>;

/**
 * Место под стрелку в триггере — ОДИН узел `<span aria-hidden>`.
 *
 * Саму стрелку кладёт потребитель: своей иконкой или через CSS. Зависимости на пакет иконок
 * у зоны нет и не будет — она делала бы наш выбор набора иконок обязательным для всех.
 */
export function SelectIcon<T extends ValidComponent = "span">(props: SelectIconComponentProps<T>) {
  traceLife("ui.select-icon");

  return <KobalteIcon data-slot="select-icon" {...(props as SelectIconProps)} />;
}

/**
 * Портал панели — узла НЕ рендерит, переносит содержимое в конец документа.
 *
 * Это допустимое «или ни одного» из формулировки 1-to-1, а не отступление от неё.
 */
export function SelectPortal(props: SelectPortalProps) {
  traceLife("ui.select-portal");

  return <KobaltePortal {...props} />;
}

/** Пропсы `SelectContent`. */
export type SelectContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SelectContentProps<T>
>;

/**
 * Всплывающая панель — **ЕДИНСТВЕННОЕ отступление от 1-to-1 во всей зоне**, и вот оно
 * названо: в документ приезжают ДВА узла — внешний позиционер (`data-popper-positioner`) и
 * сама панель внутри него.
 *
 * Обоснование, как того требует норма kobalte. Плавающая панель обязана лежать в потоке
 * позиционирования floating-ui: библиотека каждый кадр пишет координаты и высоту доступного
 * места в стиль элемента-позиционера. Слить его с панелью нельзя — тогда `transform`
 * анимации и `transform` позиционирования оказались бы на одном узле и затирали друг друга.
 * Узел приносит сам `@kobalte/core`, снять его обёрткой невозможно, и держать его отдельно
 * правильнее, чем прятать: потребитель, которому нужно попасть в позиционер CSS-ом, должен
 * знать, что тот есть.
 */
export function SelectContent<T extends ValidComponent = "div">(
  props: SelectContentComponentProps<T>,
) {
  traceLife("ui.select-content");

  return <KobalteContent data-slot="select-content" {...(props as SelectContentProps)} />;
}

/** Пропсы `SelectListbox`. */
export type SelectListboxComponentProps<
  Option,
  OptGroup = never,
  T extends ValidComponent = "ul",
> = PolymorphicProps<T, SelectListboxProps<Option, OptGroup, T>>;

/** Список вариантов — ОДИН узел `<ul role="listbox">`; элементы рисует `itemComponent` корня. */
export function SelectListbox<Option, OptGroup = never, T extends ValidComponent = "ul">(
  props: SelectListboxComponentProps<Option, OptGroup, T>,
) {
  traceLife("ui.select-listbox");

  return (
    <KobalteListbox
      data-slot="select-listbox"
      {...(props as SelectListboxProps<Option, OptGroup>)}
    />
  );
}

/** Пропсы `SelectItem`. */
export type SelectItemComponentProps<T extends ValidComponent = "li"> = PolymorphicProps<
  T,
  SelectItemProps<T>
>;

/** Вариант списка — ОДИН узел `<li role="option">`. */
export function SelectItem<T extends ValidComponent = "li">(props: SelectItemComponentProps<T>) {
  traceLife("ui.select-item");

  return <KobalteItem data-slot="select-item" {...(props as SelectItemProps)} />;
}

/** Пропсы `SelectItemLabel`. */
export type SelectItemLabelComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SelectItemLabelProps<T>
>;

/** Подпись варианта — ОДИН узел; её идентификатор уходит в `aria-labelledby` варианта. */
export function SelectItemLabel<T extends ValidComponent = "div">(
  props: SelectItemLabelComponentProps<T>,
) {
  traceLife("ui.select-item-label");

  return <KobalteItemLabel data-slot="select-item-label" {...(props as SelectItemLabelProps)} />;
}

/** Пропсы `SelectItemIndicator`. */
export type SelectItemIndicatorComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SelectItemIndicatorProps<T>
>;

/**
 * Отметка выбранного варианта — ОДИН узел, который kobalte показывает только у выбранного.
 *
 * Галочку внутрь кладёт потребитель — по той же причине, что и стрелку в `SelectIcon`.
 */
export function SelectItemIndicator<T extends ValidComponent = "div">(
  props: SelectItemIndicatorComponentProps<T>,
) {
  traceLife("ui.select-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="select-item-indicator"
      {...(props as SelectItemIndicatorProps)}
    />
  );
}
