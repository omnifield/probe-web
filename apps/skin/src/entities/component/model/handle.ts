import type { DispatchedEvent } from "@web-core/assembly";
import type { ComponentInfo } from "@web-core/ui/component-info";
import { useAtom } from "@web-core/store";
import { createEffect, createMemo, on } from "solid-js";

import { generateFakeData } from "../utils/fake-generator";
import { componentDataAtom, componentEventsAtom, componentInfoAtom, currentComponent } from "./store";

export interface ComponentHandle {
  /** Готовы ли данные компонента (инфо и io-схема пришли) — раньше генерировать/показывать нечего. */
  readonly ready: () => boolean;
  /** Сгенерировать заново фейковые данные ТЕКУЩЕГО компонента, записать в `componentDataAtom`. */
  readonly generate: () => void;
  /** Положить готовые данные напрямую в `componentDataAtom`, минуя фейк-генератор — второй
   *  источник наполнения показа (сохранённый content), рядом с `generate()`. */
  readonly setData: (data: unknown) => void;
  /** Паспорт/срез редактора/io ТЕКУЩЕГО компонента — не готово или компонент не выбран → `undefined`. */
  readonly info: () => ComponentInfo | undefined;
  /** Дописать событие в историю ТЕКУЩЕГО компонента (`componentEventsAtom`) — сброс при смене компонента. */
  readonly recordEvent: (event: DispatchedEvent) => void;
}

/**
 * Единая точка входа для всего, что знает о состоянии ТЕКУЩЕГО компонента — не абстрактный
 * генератор, а генератор ИМЕННО этого компонента: сам решает, готов ли, сам сбрасывает данные
 * ПРЕДЫДУЩЕГО компонента при смене (без этого витрина на миг показывает чужой, обычно более
 * длинный текст — гонка между сбросом `currentComponent` и приездом нового `componentInfoAtom`).
 * Новый метод — одна правка здесь, не поиск по виджетам, которые лезли в атомы напрямую.
 */
export function componentHandle(): ComponentHandle {
  const info = useAtom(componentInfoAtom);

  createEffect(
    on(currentComponent, () => {
      componentDataAtom.set(undefined);
      componentEventsAtom.set([]);
    }),
  );

  function recordEvent(event: DispatchedEvent): void {
    componentEventsAtom.set((events) => [...events, event]);
  }

  const ready = createMemo(() => {
    const state = info();
    return state.status === "done" && state.data !== undefined;
  });

  function generate(): void {
    const state = info();
    if (state.status !== "done" || state.data === undefined) return;
    componentDataAtom.set(generateFakeData(state.data.io?.schema, state.data.component));
  }

  const componentInfo = createMemo(() => {
    const state = info();
    return state.status === "done" ? state.data : undefined;
  });

  function setData(data: unknown): void {
    componentDataAtom.set(data);
  }

  return { ready, generate, setData, info: componentInfo, recordEvent };
}
