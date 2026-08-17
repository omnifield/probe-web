import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Fill as KobalteFill,
  Label as KobalteLabel,
  type ProgressFillProps,
  type ProgressLabelProps,
  type ProgressRootProps,
  type ProgressTrackProps,
  type ProgressValueLabelProps,
  Root as KobalteProgress,
  Track as KobalteTrack,
  ValueLabel as KobalteValueLabel,
} from "@kobalte/core/progress";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Полоса выполнения: загрузка файла, обработка выборки, шаг мастера.
//
// ## Чем это отличается от `Spinner`
//
// `Spinner` говорит «идёт работа», `Progress` — «сделано столько-то». Первый не знает доли и
// не должен: подставить в него проценты значит соврать. Если доля известна — это полоса.
//
// ## Неопределённое состояние — это НЕ ноль процентов
//
// `indeterminate` на корне: доля неизвестна, полоса живёт своей анимацией. Ноль процентов
// означал бы «начали и ничего не сделали» — другое утверждение, и вспомогательная техника
// читает их по-разному.

/**
 * Пропсы `Progress` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ProgressProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ProgressRootProps<T>
>;

/**
 * Корень полосы — ОДИН узел плюс контекст для частей.
 *
 * Держит значение (`value`, `minValue`, `maxValue`), `indeterminate` и `getValueLabel`.
 *
 * @example
 * ```tsx
 * <Progress value={done()} minValue={0} maxValue={total()}>
 *   <ProgressLabel>Загрузка</ProgressLabel>
 *   <ProgressValueLabel />
 *   <ProgressTrack>
 *     <ProgressFill />
 *   </ProgressTrack>
 * </Progress>
 * ```
 */
export function Progress<T extends ValidComponent = "div">(props: ProgressProps<T>) {
  traceLife("ui.progress");

  return <KobalteProgress data-slot="progress" {...(props as ProgressRootProps)} />;
}

/**
 * Пропсы `ProgressLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ProgressLabelComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ProgressLabelProps<T>
>;

/** Подпись — ОДИН узел; уходит в `aria-labelledby` корня. */
export function ProgressLabel<T extends ValidComponent = "span">(
  props: ProgressLabelComponentProps<T>,
) {
  traceLife("ui.progress-label");

  return <KobalteLabel data-slot="progress-label" {...(props as ProgressLabelProps)} />;
}

/**
 * Пропсы `ProgressValueLabel`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ProgressValueLabelComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ProgressValueLabelProps<T>
>;

/**
 * Значение текстом — ОДИН узел, по умолчанию проценты.
 *
 * Формат меняет `getValueLabel` на корне: «12 из 30 файлов» бывает нужнее процентов.
 */
export function ProgressValueLabel<T extends ValidComponent = "div">(
  props: ProgressValueLabelComponentProps<T>,
) {
  traceLife("ui.progress-value-label");

  return (
    <KobalteValueLabel data-slot="progress-value-label" {...(props as ProgressValueLabelProps)} />
  );
}

/**
 * Пропсы `ProgressTrack`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ProgressTrackComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ProgressTrackProps<T>
>;

/** Дорожка — ОДИН узел; внутри неё живёт заливка. */
export function ProgressTrack<T extends ValidComponent = "div">(
  props: ProgressTrackComponentProps<T>,
) {
  traceLife("ui.progress-track");

  return <KobalteTrack data-slot="progress-track" {...(props as ProgressTrackProps)} />;
}

/**
 * Пропсы `ProgressFill`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type ProgressFillComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  ProgressFillProps<T>
>;

/**
 * Заполненная часть — ОДИН узел.
 *
 * Долю kobalte отдаёт переменной CSS `--kb-progress-fill-width`, а не инлайновой шириной:
 * так оформление вправе выбрать, чем её выразить — шириной, `transform` или маской.
 */
export function ProgressFill<T extends ValidComponent = "div">(
  props: ProgressFillComponentProps<T>,
) {
  traceLife("ui.progress-fill");

  return <KobalteFill data-slot="progress-fill" {...(props as ProgressFillProps)} />;
}
