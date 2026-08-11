import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import { Root as KobalteSeparator, type SeparatorRootProps } from "@kobalte/core/separator";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

/**
 * Пропсы `Separator`: всё, что принимает целевой элемент, плюс `as` и `orientation`.
 *
 * @typeParam T — что рендерить. По умолчанию `hr`.
 */
export type SeparatorProps<T extends ValidComponent = "hr"> = PolymorphicProps<
  T,
  SeparatorRootProps<T>
>;

/**
 * Разделитель — ОДИН узел, по умолчанию нативный `<hr>`.
 *
 * Смысл обёртки в `orientation`: kobalte ставит `aria-orientation="vertical"` и
 * `data-orientation`, а горизонтальную ориентацию наоборот НЕ объявляет — она у роли
 * `separator` подразумевается, и лишний атрибут был бы шумом для скринридера.
 *
 * **`decorative` здесь НЕТ**, в отличие от оракула. Там проп существовал, чтобы ставить
 * `role="none"` и убирать линию из a11y-дерева, — это чужая семантика (Radix), которую
 * оракул дописал поверх kobalte. Нужен декоративный разделитель — потребитель ставит
 * `role="none"` сам, проп его насквозь донесёт: одна строка вместо ветки в примитиве.
 *
 * @example
 * ```tsx
 * <Separator />
 * <Separator orientation="vertical" />
 * <Separator as="div" role="none" />
 * ```
 */
export function Separator<T extends ValidComponent = "hr">(props: SeparatorProps<T>) {
  traceLife("ui.separator");

  return <KobalteSeparator data-slot="separator" {...(props as SeparatorRootProps)} />;
}
