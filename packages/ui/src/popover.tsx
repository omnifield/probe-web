import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Anchor as KobalteAnchor,
  Arrow as KobalteArrow,
  CloseButton as KobalteCloseButton,
  Content as KobalteContent,
  Description as KobalteDescription,
  type PopoverAnchorProps,
  type PopoverArrowProps,
  type PopoverCloseButtonProps,
  type PopoverContentProps,
  type PopoverDescriptionProps,
  type PopoverPortalProps,
  type PopoverRootProps,
  type PopoverTitleProps,
  type PopoverTriggerProps,
  Portal as KobaltePortal,
  Root as KobaltePopover,
  Title as KobalteTitle,
  Trigger as KobalteTrigger,
} from "@kobalte/core/popover";
import type { ValidComponent } from "solid-js";

import { useSlot, slotAware } from "./slot-chain.js";
import { traceLife } from "./trace.js";

// Всплывающая панель у произвольной зацепки: меню действий, панель настроек, карточка точки.
//
// ## У корня и портала СВОЕГО узла нет — и слота тоже
//
// `Popover` заводит контекст и поток позиционирования, но в документ не приводит ничего;
// `PopoverPortal` переносит содержимое и тоже не рендерит узла. Это допустимое «или ни одного»
// из формулировки 1-to-1, а не отступление, — и, значит, зацепки у них нет: зацепка обязана
// быть НА узле, иначе оформлению не за что взяться.
//
// Практическое следствие для потребителя: `data-slot="popover"` не существует, и это не
// пробел. Панель ловится по `popover-content`, кнопка — по `popover-trigger`.
//
// ## Опции позиционировщика — на КОРНЕ, как и у `Select`
//
// `placement`, `gutter`, `shift`, `flip` ставятся на `Popover`, а не на `PopoverContent`:
// позицию считает корень, панель принимает результат. Задавать зазор отступом в CSS не нужно
// и вредно — отступ спорил бы с floating-ui за ту же величину.

/** Пропсы `Popover` — корня: открытость, модальность и опции позиционировщика. */
export type PopoverProps = PopoverRootProps;

/**
 * Корень всплывающей панели — узла НЕ рендерит, заводит контекст и поток позиционирования.
 *
 * Держит открытость (`open` / `defaultOpen` / `onOpenChange`), `modal`, а также
 * `placement`, `gutter`, `shift`, `flip` — всё, что считает позицию.
 *
 * @example
 * ```tsx
 * <Popover placement="bottom-start" gutter={8}>
 *   <PopoverTrigger>Настройки</PopoverTrigger>
 *   <PopoverPortal>
 *     <PopoverContent>
 *       <PopoverArrow />
 *       <PopoverTitle>Вид таблицы</PopoverTitle>
 *       <PopoverDescription>Порядок и видимость колонок</PopoverDescription>
 *       <PopoverClose>Готово</PopoverClose>
 *     </PopoverContent>
 *   </PopoverPortal>
 * </Popover>
 * ```
 */
export function Popover(props: PopoverProps) {
  traceLife("ui.popover");

  return <KobaltePopover {...props} />;
}

/**
 * Пропсы `PopoverTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type PopoverTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  PopoverTriggerProps<T>
>;

/**
 * Кнопка, открывающая панель, — ОДИН узел `<button>`.
 *
 * Она же по умолчанию служит зацепкой позиционирования: панель встаёт относительно неё, пока
 * потребитель не поставил отдельный `PopoverAnchor`.
 */
export const PopoverTrigger = slotAware(function PopoverTrigger<T extends ValidComponent = "button">(
  props: PopoverTriggerComponentProps<T>,
) {
  traceLife("ui.popover-trigger");

  const [slot, rest] = useSlot(props, "popover-trigger");

  return <KobalteTrigger {...slot} {...(rest as PopoverTriggerProps)} />;
});

/**
 * Пропсы `PopoverAnchor`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type PopoverAnchorComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  PopoverAnchorProps<T>
>;

/**
 * Необязательная зацепка позиционирования — ОДИН узел.
 *
 * Нужна, когда панель обязана вставать не у кнопки: строка таблицы, точка на карте, ячейка.
 * Без неё зацепкой служит `PopoverTrigger`, и отдельного узла не появляется.
 */
export function PopoverAnchor<T extends ValidComponent = "div">(
  props: PopoverAnchorComponentProps<T>,
) {
  traceLife("ui.popover-anchor");

  return <KobalteAnchor data-slot="popover-anchor" {...(props as PopoverAnchorProps)} />;
}

/** Портал панели — узла НЕ рендерит, переносит содержимое в конец документа. */
export function PopoverPortal(props: PopoverPortalProps) {
  traceLife("ui.popover-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `PopoverContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type PopoverContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  PopoverContentProps<T>
>;

/**
 * Сама панель — **отступление от 1-to-1, то же самое, что у `SelectContent`**: в документ
 * приезжают ДВА узла, внешний позиционер (`data-popper-positioner`) и панель внутри него.
 *
 * Обоснование то же и оно не наше: floating-ui каждый кадр пишет координаты в стиль
 * позиционера, а слить его с панелью нельзя — `transform` анимации и `transform`
 * позиционирования оказались бы на одном узле. Узел приносит `@kobalte/core`, снять его
 * обёрткой невозможно, и держать его явным правильнее, чем прятать.
 */
export function PopoverContent<T extends ValidComponent = "div">(
  props: PopoverContentComponentProps<T>,
) {
  traceLife("ui.popover-content");

  return <KobalteContent data-slot="popover-content" {...(props as PopoverContentProps)} />;
}

/**
 * Пропсы `PopoverArrow`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type PopoverArrowComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  PopoverArrowProps<T>
>;

/**
 * Стрелка-указатель — **второе названное отступление этого файла, и оно двойное**.
 *
 * 1. **Не 1-to-1.** Узел не один: `@kobalte/core` кладёт внутрь `<svg>` с двумя контурами.
 *    Это не наш выбор и не снимается обёрткой — форма стрелки обязана быть векторной, иначе
 *    её не повернуть вслед за фактическим положением панели.
 * 2. **Несёт инлайновый стиль.** Позиция — от floating-ui; а `fill` и `stroke` kobalte СЧИТЫВАЕТ
 *    с самой панели (`background-color` и `border-*-color` узла `popover-content`). То есть
 *    цвет стрелке задаёт не кит, а оформление потребителя — стрелка лишь повторяет то, что он
 *    уже написал панели. Именно поэтому отступление приемлемо: своего вида кит не привозит.
 *
 * Размер меняется пропом `size` (пиксели), а не классом: это геометрия позиционирования, и
 * kobalte считает по ней смещение панели.
 */
export function PopoverArrow<T extends ValidComponent = "div">(
  props: PopoverArrowComponentProps<T>,
) {
  traceLife("ui.popover-arrow");

  return <KobalteArrow data-slot="popover-arrow" {...(props as PopoverArrowProps)} />;
}

/**
 * Пропсы `PopoverTitle`.
 *
 * @typeParam T — что рендерить. По умолчанию `h2`.
 */
export type PopoverTitleComponentProps<T extends ValidComponent = "h2"> = PolymorphicProps<
  T,
  PopoverTitleProps<T>
>;

/**
 * Заголовок панели — ОДИН узел `<h2>`; его идентификатор уходит в `aria-labelledby` панели.
 *
 * Уровень заголовка меняется через `as`: в глубине страницы `<h2>` может оказаться неверным,
 * и это решение потребителя, а не наше.
 */
export function PopoverTitle<T extends ValidComponent = "h2">(
  props: PopoverTitleComponentProps<T>,
) {
  traceLife("ui.popover-title");

  return <KobalteTitle data-slot="popover-title" {...(props as PopoverTitleProps)} />;
}

/**
 * Пропсы `PopoverDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `p`.
 */
export type PopoverDescriptionComponentProps<T extends ValidComponent = "p"> = PolymorphicProps<
  T,
  PopoverDescriptionProps<T>
>;

/** Пояснение панели — ОДИН узел; его идентификатор уходит в `aria-describedby` панели. */
export function PopoverDescription<T extends ValidComponent = "p">(
  props: PopoverDescriptionComponentProps<T>,
) {
  traceLife("ui.popover-description");

  return (
    <KobalteDescription data-slot="popover-description" {...(props as PopoverDescriptionProps)} />
  );
}

/**
 * Пропсы `PopoverClose`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type PopoverCloseProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  PopoverCloseButtonProps<T>
>;

/**
 * Кнопка закрытия — ОДИН узел `<button>`.
 *
 * Имя слота `popover-close`, а не `popover-close-button`: слово «button» в имени зацепки
 * ничего не добавляет — тег и так `<button>`.
 *
 * Крестик внутрь кладёт потребитель. Своей иконки у кита нет по той же причине, что и в
 * `SelectIcon`: зависимость на набор иконок сделала бы наш выбор обязательным для всех.
 */
export function PopoverClose<T extends ValidComponent = "button">(props: PopoverCloseProps<T>) {
  traceLife("ui.popover-close");

  return <KobalteCloseButton data-slot="popover-close" {...(props as PopoverCloseButtonProps)} />;
}
