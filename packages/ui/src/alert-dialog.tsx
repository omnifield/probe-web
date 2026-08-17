import {
  type AlertDialogCloseButtonProps,
  type AlertDialogContentProps,
  type AlertDialogDescriptionProps,
  type AlertDialogOverlayProps,
  type AlertDialogPortalProps,
  type AlertDialogRootProps,
  type AlertDialogTitleProps,
  type AlertDialogTriggerProps,
  CloseButton as KobalteCloseButton,
  Content as KobalteContent,
  Description as KobalteDescription,
  Overlay as KobalteOverlay,
  Portal as KobaltePortal,
  Root as KobalteAlertDialog,
  Title as KobalteTitle,
  Trigger as KobalteTrigger,
} from "@kobalte/core/alert-dialog";
import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useSlot, slotAware } from "./slot-chain.js";
import { traceLife } from "./trace.js";

// Окно, требующее решения: «удалить безвозвратно?», «выйти без сохранения?».
//
// ## Зачем отдельный примитив, если есть `Dialog`
//
// Разница в ОДНОЙ строке разметки и в двух правилах поведения:
//
//   • роль `alertdialog` вместо `dialog` — вспомогательная техника объявляет такое окно
//     немедленно и настойчивее обычного;
//   • клик мимо окна его НЕ закрывает: решение нельзя отменить случайным промахом.
//
// Оба различия несёт kobalte, и подменить их пропами `Dialog` нельзя — они в поведении, а не
// в виде. Отсюда и своё имя зацепок: оформление у предупреждения обычно другое.

/** Пропсы `AlertDialog` — корня. */
export type AlertDialogProps = AlertDialogRootProps;

/**
 * Корень окна-предупреждения — узла НЕ рендерит, заводит контекст.
 *
 * @example
 * ```tsx
 * <AlertDialog open={confirming()} onOpenChange={setConfirming}>
 *   <AlertDialogPortal>
 *     <AlertDialogOverlay />
 *     <AlertDialogContent>
 *       <AlertDialogTitle>Удалить безвозвратно?</AlertDialogTitle>
 *       <AlertDialogDescription>Восстановить будет нельзя.</AlertDialogDescription>
 *       <AlertDialogClose>Отмена</AlertDialogClose>
 *       <Button onClick={remove}>Удалить</Button>
 *     </AlertDialogContent>
 *   </AlertDialogPortal>
 * </AlertDialog>
 * ```
 */
export function AlertDialog(props: AlertDialogProps) {
  traceLife("ui.alert-dialog");

  return <KobalteAlertDialog {...props} />;
}

/**
 * Пропсы `AlertDialogTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type AlertDialogTriggerComponentProps<T extends ValidComponent = "button"> =
  PolymorphicProps<T, AlertDialogTriggerProps<T>>;

/** Кнопка, открывающая окно, — ОДИН узел `<button>`. */
export const AlertDialogTrigger = slotAware(function AlertDialogTrigger<T extends ValidComponent = "button">(
  props: AlertDialogTriggerComponentProps<T>,
) {
  traceLife("ui.alert-dialog-trigger");

  const [slot, rest] = useSlot(props, "alert-dialog-trigger");

  return (
    <KobalteTrigger {...slot} {...(rest as AlertDialogTriggerProps)} />
  );
});

/** Портал окна — узла НЕ рендерит, переносит содержимое в конец документа. */
export function AlertDialogPortal(props: AlertDialogPortalProps) {
  traceLife("ui.alert-dialog-portal");

  return <KobaltePortal {...props} />;
}

/**
 * Пропсы `AlertDialogOverlay`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type AlertDialogOverlayComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  AlertDialogOverlayProps<T>
>;

/** Подложка — ОДИН узел; затемнения по умолчанию нет, как и у `DialogOverlay`. */
export function AlertDialogOverlay<T extends ValidComponent = "div">(
  props: AlertDialogOverlayComponentProps<T>,
) {
  traceLife("ui.alert-dialog-overlay");

  return (
    <KobalteOverlay data-slot="alert-dialog-overlay" {...(props as AlertDialogOverlayProps)} />
  );
}

/**
 * Пропсы `AlertDialogContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type AlertDialogContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  AlertDialogContentProps<T>
>;

/** Само окно — ОДИН узел `[role=alertdialog]`; позиционера у него нет, как и у `Dialog`. */
export function AlertDialogContent<T extends ValidComponent = "div">(
  props: AlertDialogContentComponentProps<T>,
) {
  traceLife("ui.alert-dialog-content");

  return (
    <KobalteContent data-slot="alert-dialog-content" {...(props as AlertDialogContentProps)} />
  );
}

/**
 * Пропсы `AlertDialogTitle`.
 *
 * @typeParam T — что рендерить. По умолчанию `h2`.
 */
export type AlertDialogTitleComponentProps<T extends ValidComponent = "h2"> = PolymorphicProps<
  T,
  AlertDialogTitleProps<T>
>;

/** Заголовок — ОДИН узел; уходит в `aria-labelledby`. Без него окно безымянно. */
export function AlertDialogTitle<T extends ValidComponent = "h2">(
  props: AlertDialogTitleComponentProps<T>,
) {
  traceLife("ui.alert-dialog-title");

  return <KobalteTitle data-slot="alert-dialog-title" {...(props as AlertDialogTitleProps)} />;
}

/**
 * Пропсы `AlertDialogDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `p`.
 */
export type AlertDialogDescriptionComponentProps<T extends ValidComponent = "p"> =
  PolymorphicProps<T, AlertDialogDescriptionProps<T>>;

/** Пояснение — ОДИН узел; уходит в `aria-describedby`. Здесь и объясняют последствие. */
export function AlertDialogDescription<T extends ValidComponent = "p">(
  props: AlertDialogDescriptionComponentProps<T>,
) {
  traceLife("ui.alert-dialog-description");

  return (
    <KobalteDescription
      data-slot="alert-dialog-description"
      {...(props as AlertDialogDescriptionProps)}
    />
  );
}

/**
 * Пропсы `AlertDialogClose`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type AlertDialogCloseProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  AlertDialogCloseButtonProps<T>
>;

/**
 * Кнопка отмены — ОДИН узел `<button>`.
 *
 * Кнопку ПОДТВЕРЖДЕНИЯ кит не привозит: она делает работу потребителя (удаляет, выходит) и
 * закрывает окно сама. Это обычный `Button` с его обработчиком — придумывать ему зацепку
 * значило бы решать за потребителя, где эта кнопка стоит и как называется.
 */
export function AlertDialogClose<T extends ValidComponent = "button">(
  props: AlertDialogCloseProps<T>,
) {
  traceLife("ui.alert-dialog-close");

  return (
    <KobalteCloseButton data-slot="alert-dialog-close" {...(props as AlertDialogCloseButtonProps)} />
  );
}
