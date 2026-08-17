import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { Root as KobalteSkeleton, type SkeletonRootProps } from "@kobalte/core/skeleton";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

/**
 * Пропсы `Skeleton`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type SkeletonProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  SkeletonRootProps<T>
>;

/**
 * Заглушка на месте ещё не приехавшего содержимого — ОДИН узел.
 *
 * `visible` управляет тем, что показано: пока `true` — заглушка, дальше — дети. Оборачивает,
 * а не заменяет, поэтому размер берётся у содержимого и не задаётся числом из головы.
 *
 * Мерцания у заглушки НЕТ по умолчанию: анимация это вид, и пишет её оформление по
 * `[data-slot="skeleton"][data-visible]`. Пропы `animate`, `circle`, `radius` у kobalte
 * доступны насквозь, но ни один из них мы не выставляем за потребителя.
 *
 * **Названный служебный стиль:** kobalte всегда пишет сюда `width` и `height` (по умолчанию
 * `100%` и `auto`) — это его пропы размера, а не наше оформление. Меняются они теми же пропами
 * или CSS потребителя; ни цвета, ни фона в стиле нет.
 *
 * @example
 * ```tsx
 * <Skeleton visible={loading()}>
 *   <p>{article()}</p>
 * </Skeleton>
 * ```
 */
export function Skeleton<T extends ValidComponent = "div">(props: SkeletonProps<T>) {
  traceLife("ui.skeleton");

  return <KobalteSkeleton data-slot="skeleton" {...(props as SkeletonRootProps)} />;
}
