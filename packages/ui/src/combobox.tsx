import {
  Arrow as KobalteArrow,
  type ComboboxArrowProps,
  type ComboboxContentProps,
  type ComboboxControlProps,
  type ComboboxDescriptionProps,
  type ComboboxErrorMessageProps,
  type ComboboxHiddenSelectProps,
  type ComboboxIconProps,
  type ComboboxInputProps,
  type ComboboxItemDescriptionProps,
  type ComboboxItemIndicatorProps,
  type ComboboxItemLabelProps,
  type ComboboxItemProps,
  type ComboboxLabelProps,
  type ComboboxListboxProps,
  type ComboboxPortalProps,
  type ComboboxRootProps,
  type ComboboxSectionProps,
  type ComboboxTriggerProps,
  Content as KobalteContent,
  Control as KobalteControl,
  Description as KobalteDescription,
  ErrorMessage as KobalteErrorMessage,
  HiddenSelect as KobalteHiddenSelect,
  Icon as KobalteIcon,
  Input as KobalteInput,
  Item as KobalteItem,
  ItemDescription as KobalteItemDescription,
  ItemIndicator as KobalteItemIndicator,
  ItemLabel as KobalteItemLabel,
  Label as KobalteLabel,
  Listbox as KobalteListbox,
  Portal as KobaltePortal,
  Root as KobalteCombobox,
  Section as KobalteSection,
  Trigger as KobalteTrigger,
} from "@kobalte/core/combobox";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Поле с поиском по списку: выбор города, колонки, пресета — там, где вариантов слишком много
// для `Select`.
//
// ## Чем это отличается от `Select`, и почему это не «`Select` с полем ввода»
//
// У `Select` кнопка, у `Combobox` — НАСТОЯЩИЙ `<input>`: в него печатают, он держит фокус и
// текст запроса. Отсюда и части, которых у списка нет: `combobox-control` (рамка вокруг ввода
// и кнопки), `combobox-hidden-select` (форма отправляет выбранное значение, а не текст).
//
// ## Фильтрация ЕСТЬ по умолчанию — и это надо знать заранее
//
// `@kobalte/core` фильтрует сам: `defaultFilter: "contains"` поверх `Intl.Collator` с
// `sensitivity: "base"` — то есть без учёта регистра и диакритики, по правилам локали. Это не
// наша надстройка и мы её не выключаем: работает она правильно и на кириллице тоже.
//
// Когда встроенного мало (поиск по нескольким полям, нечёткое совпадение, запрос на сервер) —
// потребитель либо передаёт `defaultFilter` своей функцией, либо считает `options` сам по
// `onInputChange`. Оба пути открыты, и ни один не требует правок кита.
//
// ## Опции позиционировщика — на корне, как у всего всплывающего
//
// `placement`, `gutter`, `sameWidth` ставятся на `Combobox`. Служебный стиль панели и стрелки
// разобран в `src/popover.tsx`: механика, не вид.

/**
 * Пропсы `Combobox` — корня.
 *
 * @typeParam Option — тип варианта. @typeParam OptGroup — тип раздела.
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxProps<
  Option,
  OptGroup = never,
  T extends ValidComponent = "div",
> = PolymorphicProps<T, ComboboxRootProps<Option, OptGroup, T>>;

/**
 * Корень — ОДИН узел плюс контекст для частей.
 *
 * Держит варианты (`options`), выбранное значение, текст запроса (`onInputChange`),
 * `disabled`, `validationState` и опции позиционировщика. Разметку задаёт потребитель.
 *
 * @example
 * ```tsx
 * <Combobox<string>
 *   options={found()}
 *   onInputChange={(query) => setFound(search(query))}
 *   itemComponent={(p) => (
 *     <ComboboxItem item={p.item}>
 *       <ComboboxItemLabel>{p.item.rawValue}</ComboboxItemLabel>
 *     </ComboboxItem>
 *   )}
 * >
 *   <ComboboxControl>
 *     <ComboboxInput />
 *     <ComboboxTrigger><ComboboxIcon>▾</ComboboxIcon></ComboboxTrigger>
 *   </ComboboxControl>
 *   <ComboboxPortal>
 *     <ComboboxContent><ComboboxListbox /></ComboboxContent>
 *   </ComboboxPortal>
 * </Combobox>
 * ```
 */
export function Combobox<Option, OptGroup = never, T extends ValidComponent = "div">(
  props: ComboboxProps<Option, OptGroup, T>,
) {
  traceLife("ui.combobox");

  return (
    <KobalteCombobox data-slot="combobox" {...(props as ComboboxRootProps<Option, OptGroup>)} />
  );
}

/**
 * Пропсы `ComboboxLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `label`.
 */
export type ComboboxLabelComponentProps<T extends ValidComponent = "label"> = PolymorphicProps<
  T,
  ComboboxLabelProps<T>
>;

/** Подпись поля — ОДИН узел `<label>`, связанный с вводом по контексту корня. */
export function ComboboxLabel<T extends ValidComponent = "label">(
  props: ComboboxLabelComponentProps<T>,
) {
  traceLife("ui.combobox-label");

  return <KobalteLabel data-slot="combobox-label" {...(props as ComboboxLabelProps)} />;
}

/**
 * Пропсы `ComboboxControl`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxControlComponentProps<
  Option,
  T extends ValidComponent = "div",
> = PolymorphicProps<T, ComboboxControlProps<Option, T>>;

/**
 * Рамка вокруг ввода и кнопки — ОДИН узел.
 *
 * Отдельная часть, а не оформление ввода: рамка обязана реагировать на фокус ВНУТРИ себя и
 * держать рядом кнопку раскрытия. Оформить это на самом `<input>` нельзя — кнопка окажется
 * снаружи рамки.
 */
export function ComboboxControl<Option, T extends ValidComponent = "div">(
  props: ComboboxControlComponentProps<Option, T>,
) {
  traceLife("ui.combobox-control");

  return <KobalteControl data-slot="combobox-control" {...(props as ComboboxControlProps<Option>)} />;
}

/**
 * Пропсы `ComboboxInput`.
 *
 * @typeParam T — что рендерить. По умолчанию `input`.
 */
export type ComboboxInputComponentProps<T extends ValidComponent = "input"> = PolymorphicProps<
  T,
  ComboboxInputProps<T>
>;

/** Поле запроса — ОДИН настоящий `<input role="combobox">`: в него печатают. */
export function ComboboxInput<T extends ValidComponent = "input">(
  props: ComboboxInputComponentProps<T>,
) {
  traceLife("ui.combobox-input");

  return <KobalteInput data-slot="combobox-input" {...(props as ComboboxInputProps)} />;
}

/**
 * Пропсы `ComboboxTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type ComboboxTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ComboboxTriggerProps<T>
>;

/** Кнопка раскрытия списка — ОДИН узел `<button>` рядом с вводом. */
export function ComboboxTrigger<T extends ValidComponent = "button">(
  props: ComboboxTriggerComponentProps<T>,
) {
  traceLife("ui.combobox-trigger");

  return <KobalteTrigger data-slot="combobox-trigger" {...(props as ComboboxTriggerProps)} />;
}

/**
 * Пропсы `ComboboxIcon`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ComboboxIconComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ComboboxIconProps<T>
>;

/** Место под стрелку в кнопке — ОДИН узел `<span aria-hidden>`; иконку кладёт потребитель. */
export function ComboboxIcon<T extends ValidComponent = "span">(
  props: ComboboxIconComponentProps<T>,
) {
  traceLife("ui.combobox-icon");

  return <KobalteIcon data-slot="combobox-icon" {...(props as ComboboxIconProps)} />;
}

/**
 * Скрытый `<select>` для формы — зацепка стоит на нём, но узлов приезжает БОЛЬШЕ.
 *
 * Нужен, когда поле уезжает обычной отправкой формы: браузер отправляет ВЫБРАННОЕ значение, а
 * не текст запроса. Без него форма не узнает о выборе ничего.
 *
 * **Названное отступление от 1-to-1**, и оно чужое: `@kobalte/core` заворачивает `<select>` в
 * скрытую обёртку (`visuallyHiddenStyles`) и кладёт рядом с ним технический `<input>`. Оба
 * узла — обход браузерных особенностей, названных в исходнике kobalte: в Safari автозаполнение
 * не работает при `display: none`, в Firefox `<select>` должен быть подписан. Стиль поэтому
 * стоит на ОБЁРТКЕ, а не на самой зацепке — оформлению здесь делать нечего, узел невидим.
 */
export function ComboboxHiddenSelect(props: ComboboxHiddenSelectProps) {
  traceLife("ui.combobox-hidden-select");

  return <KobalteHiddenSelect data-slot="combobox-hidden-select" {...props} />;
}

/** Портал панели — узла НЕ рендерит, переносит содержимое в конец документа. */
export function ComboboxPortal(props: ComboboxPortalProps) {
  traceLife("ui.combobox-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `ComboboxContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ComboboxContentProps<T>
>;

/** Всплывающая панель — то же отступление от 1-to-1, что у `SelectContent` и `PopoverContent`. */
export function ComboboxContent<T extends ValidComponent = "div">(
  props: ComboboxContentComponentProps<T>,
) {
  traceLife("ui.combobox-content");

  return <KobalteContent data-slot="combobox-content" {...(props as ComboboxContentProps)} />;
}

/**
 * Пропсы `ComboboxArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ComboboxArrowProps<T>
>;

/** Стрелка-указатель — та же механика и те же отступления, что у `PopoverArrow`. */
export function ComboboxArrow<T extends ValidComponent = "div">(
  props: ComboboxArrowComponentProps<T>,
) {
  traceLife("ui.combobox-arrow");

  return <KobalteArrow data-slot="combobox-arrow" {...(props as ComboboxArrowProps)} />;
}

/**
 * Пропсы `ComboboxListbox`.
 *
 * @typeParam T — что рендерить. По умолчанию `ul`.
 */
export type ComboboxListboxComponentProps<
  Option,
  OptGroup = never,
  T extends ValidComponent = "ul",
> = PolymorphicProps<T, ComboboxListboxProps<Option, OptGroup, T>>;

/** Список найденного — ОДИН узел `<ul role="listbox">`; элементы рисует `itemComponent` корня. */
export function ComboboxListbox<Option, OptGroup = never, T extends ValidComponent = "ul">(
  props: ComboboxListboxComponentProps<Option, OptGroup, T>,
) {
  traceLife("ui.combobox-listbox");

  return (
    <KobalteListbox
      data-slot="combobox-listbox"
      {...(props as ComboboxListboxProps<Option, OptGroup>)}
    />
  );
}

/**
 * Пропсы `ComboboxItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `li`.
 */
export type ComboboxItemComponentProps<T extends ValidComponent = "li"> = PolymorphicProps<
  T,
  ComboboxItemProps<T>
>;

/** Найденный вариант — ОДИН узел `<li role="option">`. */
export function ComboboxItem<T extends ValidComponent = "li">(
  props: ComboboxItemComponentProps<T>,
) {
  traceLife("ui.combobox-item");

  return <KobalteItem data-slot="combobox-item" {...(props as ComboboxItemProps)} />;
}

/**
 * Пропсы `ComboboxItemLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxItemLabelComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ComboboxItemLabelProps<T>
>;

/** Подпись варианта — ОДИН узел; её текст уходит в имя варианта. */
export function ComboboxItemLabel<T extends ValidComponent = "div">(
  props: ComboboxItemLabelComponentProps<T>,
) {
  traceLife("ui.combobox-item-label");

  return (
    <KobalteItemLabel data-slot="combobox-item-label" {...(props as ComboboxItemLabelProps)} />
  );
}

/**
 * Пропсы `ComboboxItemDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxItemDescriptionComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ComboboxItemDescriptionProps<T>>;

/** Пояснение к варианту — ОДИН узел; уходит в `aria-describedby` варианта. */
export function ComboboxItemDescription<T extends ValidComponent = "div">(
  props: ComboboxItemDescriptionComponentProps<T>,
) {
  traceLife("ui.combobox-item-description");

  return (
    <KobalteItemDescription
      data-slot="combobox-item-description"
      {...(props as ComboboxItemDescriptionProps)}
    />
  );
}

/**
 * Пропсы `ComboboxItemIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxItemIndicatorComponentProps<T extends ValidComponent = "div"> =
  PolymorphicProps<T, ComboboxItemIndicatorProps<T>>;

/** Отметка выбранного варианта — ОДИН узел, только у выбранного. `forceMount` насквозь. */
export function ComboboxItemIndicator<T extends ValidComponent = "div">(
  props: ComboboxItemIndicatorComponentProps<T>,
) {
  traceLife("ui.combobox-item-indicator");

  return (
    <KobalteItemIndicator
      data-slot="combobox-item-indicator"
      {...(props as ComboboxItemIndicatorProps)}
    />
  );
}

/**
 * Пропсы `ComboboxSection`.
 *
 * @typeParam T — что рендерить. По умолчанию `li`.
 */
export type ComboboxSectionComponentProps<T extends ValidComponent = "li"> = PolymorphicProps<
  T,
  ComboboxSectionProps<T>
>;

/**
 * Заголовок раздела в списке — ОДИН узел `<li role="presentation">`.
 *
 * Тег `li`, а не `div`, потому что он лежит ВНУТРИ `<ul>`: иначе разметка списка перестала бы
 * быть валидной, а вспомогательная техника сбилась бы со счёта вариантов.
 */
export function ComboboxSection<T extends ValidComponent = "li">(
  props: ComboboxSectionComponentProps<T>,
) {
  traceLife("ui.combobox-section");

  return <KobalteSection data-slot="combobox-section" {...(props as ComboboxSectionProps)} />;
}

/**
 * Пропсы `ComboboxDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxDescriptionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ComboboxDescriptionProps<T>
>;

/** Пояснение к полю — ОДИН узел; уходит в `aria-describedby` ввода. */
export function ComboboxDescription<T extends ValidComponent = "div">(
  props: ComboboxDescriptionComponentProps<T>,
) {
  traceLife("ui.combobox-description");

  return (
    <KobalteDescription data-slot="combobox-description" {...(props as ComboboxDescriptionProps)} />
  );
}

/**
 * Пропсы `ComboboxError`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ComboboxErrorProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ComboboxErrorMessageProps<T>
>;

/** Сообщение об ошибке — ОДИН узел, только при `validationState="invalid"`. */
export function ComboboxError<T extends ValidComponent = "div">(props: ComboboxErrorProps<T>) {
  traceLife("ui.combobox-error");

  return (
    <KobalteErrorMessage data-slot="combobox-error" {...(props as ComboboxErrorMessageProps)} />
  );
}
