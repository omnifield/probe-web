import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  CloseButton as KobalteCloseButton,
  Description as KobalteDescription,
  List as KobalteList,
  ProgressFill as KobalteProgressFill,
  ProgressTrack as KobalteProgressTrack,
  Region as KobalteRegion,
  Root as KobalteToast,
  Title as KobalteTitle,
  type ToastCloseButtonProps,
  type ToastDescriptionProps,
  type ToastListProps,
  type ToastProgressFillProps,
  type ToastProgressTrackProps,
  type ToastRegionProps,
  type ToastRootProps,
  type ToastTitleProps,
} from "@kobalte/core/toast";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Уведомления: «сохранено», «не удалось загрузить», «выгрузка готова».
//
// ## Единственный примитив зоны, который зовут КОДОМ, а не ставят в разметку
//
// Уведомление появляется в ответ на событие, которого в разметке нет: ответ сервера, ошибка
// таймера. Поэтому у него две половины:
//
//   • `ToastRegion` + `ToastList` — ставятся ОДИН раз в скелете приложения;
//   • `toaster.show(…)` — зовётся из кода в момент события.
//
// Мы отдаём `toaster` наружу как есть, своей обёртки над ним нет: это очередь уведомлений со
// своим состоянием, и оборачивать её ради «чтобы было наше» значило бы завести второй
// источник правды о том, что сейчас на экране.
//
// ## Дважды `Progress` — но это не он
//
// `toast-progress-track` и `toast-progress-fill` показывают, сколько уведомлению осталось
// жить. Это не полоса выполнения задачи: она про работу, а эта — про таймер жизни узла.

/** Очередь уведомлений `@kobalte/core`: `show`, `update`, `dismiss`, `promise`, `clear`. */
export { toaster } from "@kobalte/core/toast";

/**
 * Пропсы `ToastRegion`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ToastRegionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ToastRegionProps<T>
>;

/**
 * Область уведомлений — ОДИН узел; ставится один раз в скелете приложения.
 *
 * Она же держит горячую клавишу перехода к уведомлениям (`hotkey`, по умолчанию F8) и
 * ограничение на число видимых (`limit`). Место на экране — дело оформления.
 */
export function ToastRegion<T extends ValidComponent = "div">(
  props: ToastRegionComponentProps<T>,
) {
  traceLife("ui.toast-region");

  return <KobalteRegion data-slot="toast-region" {...(props as ToastRegionProps)} />;
}

/**
 * Пропсы `ToastList`.
 *
 * @typeParam T — что рендерить. По умолчанию `ol`.
 */
export type ToastListComponentProps<T extends ValidComponent = "ol"> = PolymorphicProps<
  T,
  ToastListProps<T>
>;

/**
 * Список уведомлений — ОДИН узел `<ol>` внутри области.
 *
 * Именно `ol`, а не `div`: у уведомлений есть порядок, и вспомогательная техника его читает.
 */
export function ToastList<T extends ValidComponent = "ol">(props: ToastListComponentProps<T>) {
  traceLife("ui.toast-list");

  return <KobalteList data-slot="toast-list" {...(props as ToastListProps)} />;
}

/**
 * Пропсы `Toast` — одного уведомления.
 *
 * @typeParam T — что рендерить. По умолчанию `li`.
 */
export type ToastProps<T extends ValidComponent = "li"> = PolymorphicProps<T, ToastRootProps<T>>;

/**
 * Одно уведомление — ОДИН узел `<li>`; возвращается из `toaster.show`.
 *
 * `toastId` обязателен и приходит в компонент от очереди — без него уведомление не умеет
 * закрыть само себя.
 *
 * @example
 * ```tsx
 * toaster.show((props) => (
 *   <Toast toastId={props.toastId}>
 *     <ToastTitle>Сохранено</ToastTitle>
 *     <ToastClose>×</ToastClose>
 *     <ToastProgressTrack><ToastProgressFill /></ToastProgressTrack>
 *   </Toast>
 * ));
 * ```
 */
export function Toast<T extends ValidComponent = "li">(props: ToastProps<T>) {
  traceLife("ui.toast");

  return <KobalteToast data-slot="toast" {...(props as ToastRootProps)} />;
}

/**
 * Пропсы `ToastTitle`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ToastTitleComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ToastTitleProps<T>
>;

/** Заголовок уведомления — ОДИН узел; уходит в `aria-labelledby`. */
export function ToastTitle<T extends ValidComponent = "div">(props: ToastTitleComponentProps<T>) {
  traceLife("ui.toast-title");

  return <KobalteTitle data-slot="toast-title" {...(props as ToastTitleProps)} />;
}

/**
 * Пропсы `ToastDescription`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ToastDescriptionComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ToastDescriptionProps<T>
>;

/** Пояснение уведомления — ОДИН узел; уходит в `aria-describedby`. */
export function ToastDescription<T extends ValidComponent = "div">(
  props: ToastDescriptionComponentProps<T>,
) {
  traceLife("ui.toast-description");

  return (
    <KobalteDescription data-slot="toast-description" {...(props as ToastDescriptionProps)} />
  );
}

/**
 * Пропсы `ToastClose`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type ToastCloseProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  ToastCloseButtonProps<T>
>;

/** Кнопка закрытия — ОДИН узел `<button>`. Имя слота `toast-close`, как у `popover-close`. */
export function ToastClose<T extends ValidComponent = "button">(props: ToastCloseProps<T>) {
  traceLife("ui.toast-close");

  return <KobalteCloseButton data-slot="toast-close" {...(props as ToastCloseButtonProps)} />;
}

/**
 * Пропсы `ToastProgressTrack`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ToastProgressTrackComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ToastProgressTrackProps<T>
>;

/** Дорожка таймера жизни уведомления — ОДИН узел. */
export function ToastProgressTrack<T extends ValidComponent = "div">(
  props: ToastProgressTrackComponentProps<T>,
) {
  traceLife("ui.toast-progress-track");

  return (
    <KobalteProgressTrack
      data-slot="toast-progress-track"
      {...(props as ToastProgressTrackProps)}
    />
  );
}

/**
 * Пропсы `ToastProgressFill`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ToastProgressFillComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ToastProgressFillProps<T>
>;

/** Заполнение таймера — ОДИН узел; долю kobalte отдаёт переменной CSS. */
export function ToastProgressFill<T extends ValidComponent = "div">(
  props: ToastProgressFillComponentProps<T>,
) {
  traceLife("ui.toast-progress-fill");

  return (
    <KobalteProgressFill data-slot="toast-progress-fill" {...(props as ToastProgressFillProps)} />
  );
}
