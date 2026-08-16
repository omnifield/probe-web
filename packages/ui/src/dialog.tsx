import {
  CloseButton as KobalteCloseButton,
  Content as KobalteContent,
  Description as KobalteDescription,
  type DialogCloseButtonProps,
  type DialogContentProps,
  type DialogDescriptionProps,
  type DialogOverlayProps,
  type DialogPortalProps,
  type DialogRootProps,
  type DialogTitleProps,
  type DialogTriggerProps,
  Overlay as KobalteOverlay,
  Portal as KobaltePortal,
  Root as KobalteDialog,
  Title as KobalteTitle,
  Trigger as KobalteTrigger,
} from "@kobalte/core/dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Модальное окно: подтверждение, форма поверх страницы, просмотр записи.
//
// ## Чем это отличается от `Popover`, и почему разница не в размере
//
//   • `Popover` встаёт ОТНОСИТЕЛЬНО зацепки и не забирает страницу: floating-ui считает ему
//     координаты, остальное продолжает работать.
//   • `Dialog` забирает страницу целиком: фокус заперт внутри, прокрутка фона остановлена, всё
//     под ним объявлено недоступным. Позиционировщика у него нет вовсе — окно ставит CSS
//     потребителя, обычно по центру.
//
// Отсюда и подложка (`dialog-overlay`) — отдельный узел, которого у панели нет: она гасит фон
// и ловит клик мимо окна.
//
// ## Узла нет у корня и портала — зацепок у них тоже нет
//
// Как и у `Popover`: `Dialog` заводит контекст, `DialogPortal` переносит содержимое. Окно
// ловится по `dialog-content`, подложка — по `dialog-overlay`.

/** Пропсы `Dialog` — корня: открытость, модальность, поведение фокуса. */
export type DialogProps = DialogRootProps;

/**
 * Корень окна — узла НЕ рендерит, заводит контекст.
 *
 * Держит открытость (`open` / `defaultOpen` / `onOpenChange`), `modal`, `preventScroll` и
 * `initialFocusEl`. Разметку задаёт потребитель — порядок частей наш примитив не знает.
 *
 * @example
 * ```tsx
 * <Dialog open={confirming()} onOpenChange={setConfirming}>
 *   <DialogTrigger>Удалить</DialogTrigger>
 *   <DialogPortal>
 *     <DialogOverlay />
 *     <DialogContent>
 *       <DialogTitle>Удалить запись?</DialogTitle>
 *       <DialogDescription>Действие необратимо.</DialogDescription>
 *       <DialogClose>Отмена</DialogClose>
 *     </DialogContent>
 *   </DialogPortal>
 * </Dialog>
 * ```
 */
export function Dialog(props: DialogProps) {
  traceLife("ui.dialog");

  return <KobalteDialog {...props} />;
}

/**
 * Пропсы `DialogTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type DialogTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  DialogTriggerProps<T>
>;

/**
 * Кнопка, открывающая окно, — ОДИН узел `<button>`.
 *
 * Необязательна: окном часто управляют извне (`open` из состояния приложения), и тогда кнопки
 * в разметке просто нет.
 */
export function DialogTrigger<T extends ValidComponent = "button">(
  props: DialogTriggerComponentProps<T>,
) {
  traceLife("ui.dialog-trigger");

  return <KobalteTrigger data-slot="dialog-trigger" {...(props as DialogTriggerProps)} />;
}

/** Портал окна — узла НЕ рендерит, переносит содержимое в конец документа. */
export function DialogPortal(props: DialogPortalProps) {
  traceLife("ui.dialog-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `DialogOverlay`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DialogOverlayComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  DialogOverlayProps<T>
>;

/**
 * Подложка — ОДИН узел, гасящий фон.
 *
 * Своя часть, а не псевдоэлемент окна: у неё своё состояние появления (`data-expanded`), свой
 * переход и свой клик «мимо окна». Псевдоэлементом ни то, ни другое не сделать.
 *
 * Затемнения по умолчанию у неё НЕТ — цвет и прозрачность пишет оформление. Пустая подложка
 * без правил CSS невидима, и это не дефект: кит остаётся безголовым и здесь.
 */
export function DialogOverlay<T extends ValidComponent = "div">(
  props: DialogOverlayComponentProps<T>,
) {
  traceLife("ui.dialog-overlay");

  return <KobalteOverlay data-slot="dialog-overlay" {...(props as DialogOverlayProps)} />;
}

/**
 * Пропсы `DialogContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type DialogContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  DialogContentProps<T>
>;

/**
 * Само окно — ОДИН узел `[role=dialog]`.
 *
 * Позиционера здесь НЕТ, в отличие от `Popover` и `Select`: окно не привязано к зацепке, и
 * ставит его CSS потребителя. То есть 1-to-1 у окна не нарушено — отступление всплывающих
 * панелей сюда не распространяется.
 *
 * В модальном режиме kobalte кладёт внутрь сторожевые узлы фокуса (`span[data-focus-trap]`) —
 * они без зацепок и не наши; знать о них стоит, чтобы не удивляться лишним детям.
 */
export function DialogContent<T extends ValidComponent = "div">(
  props: DialogContentComponentProps<T>,
) {
  traceLife("ui.dialog-content");

  return <KobalteContent data-slot="dialog-content" {...(props as DialogContentProps)} />;
}

/**
 * Пропсы `DialogTitle`.
 *
 * @typeParam T — что рендерить. По умолчанию `h2`.
 */
export type DialogTitleComponentProps<T extends ValidComponent = "h2"> = PolymorphicProps<
  T,
  DialogTitleProps<T>
>;

/**
 * Заголовок окна — ОДИН узел `<h2>`; его идентификатор уходит в `aria-labelledby` окна.
 *
 * Без него окно открывается безымянным: скринридер объявит «диалог» и замолчит.
 */
export function DialogTitle<T extends ValidComponent = "h2">(props: DialogTitleComponentProps<T>) {
  traceLife("ui.dialog-title");

  return <KobalteTitle data-slot="dialog-title" {...(props as DialogTitleProps)} />;
}

/**
 * Пропсы `DialogDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `p`.
 */
export type DialogDescriptionComponentProps<T extends ValidComponent = "p"> = PolymorphicProps<
  T,
  DialogDescriptionProps<T>
>;

/** Пояснение окна — ОДИН узел; уходит в `aria-describedby` окна. */
export function DialogDescription<T extends ValidComponent = "p">(
  props: DialogDescriptionComponentProps<T>,
) {
  traceLife("ui.dialog-description");

  return (
    <KobalteDescription data-slot="dialog-description" {...(props as DialogDescriptionProps)} />
  );
}

/**
 * Пропсы `DialogClose`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type DialogCloseProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  DialogCloseButtonProps<T>
>;

/**
 * Кнопка закрытия — ОДИН узел `<button>`. Имя слота `dialog-close` — как у `popover-close`.
 *
 * Она не единственный способ закрыть: `Esc` и клик по подложке работают сами. Кнопка нужна
 * для указателя и для тех случаев, когда закрытие должно быть видимым действием.
 */
export function DialogClose<T extends ValidComponent = "button">(props: DialogCloseProps<T>) {
  traceLife("ui.dialog-close");

  return <KobalteCloseButton data-slot="dialog-close" {...(props as DialogCloseButtonProps)} />;
}
