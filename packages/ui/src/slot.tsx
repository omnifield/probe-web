import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

/**
 * Пропсы `Slot`: всё, что принимает целевой элемент/компонент, плюс `as`.
 *
 * @typeParam T — что рендерить: имя тега или компонент. По умолчанию `div`.
 */
export type SlotProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/**
 * Полиморфная база: рендерит ровно то, что названо в `as`, и больше ничего.
 *
 * Своего узла у `Slot` НЕТ — он и есть узел `as`. Это и делает его базой: любой примитив,
 * которому нужна смена тега, строится на нём, а не на своей ветке `Dynamic`.
 *
 * `data-slot` здесь не ставится намеренно: семантику узла задаёт потребитель через `as`, и
 * приклеивать ей наше имя значило бы назвать за него то, что он ещё не решил.
 *
 * @example
 * ```tsx
 * <Slot>обычный div</Slot>
 * <Slot as="span">строчный</Slot>
 * <Slot as="a" href="/docs">ссылка</Slot>
 * <Slot as={MyComponent} ref={setEl} onClick={handler} />
 * ```
 */
export function Slot<T extends ValidComponent = "div">(props: SlotProps<T>) {
  traceLife("ui.slot");

  // `as="div"` стоит ДО спреда — значит это дефолт, который проп потребителя перебивает.
  // Порядок здесь часть контракта: `mergeProps` берёт последнее значение (норма доки).
  return <Polymorphic as="div" {...props} />;
}
