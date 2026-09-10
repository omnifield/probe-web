import type { DispatchedEvent } from "@web-core/assembly";
import type { ComponentInfo } from "@web-core/ui/component-info";
import { useAtom } from "@web-core/store";
import { createEffect, createMemo, on } from "solid-js";

import { componentDataAtom, componentEventsAtom, componentInfoAtom, currentComponent } from "./store";

export interface ComponentHandle {
  /** Готовы ли данные компонента (инфо и io-схема пришли) — раньше показывать нечего. */
  readonly ready: () => boolean;
  /** Данные компонента ЕДУТ прямо сейчас. Не противоположность `ready`: на смене компонента
   *  ресурс держит последнее известное `info` (значит `ready` остаётся true), но показывать по
   *  нему уже нельзя — оно от ПРЕДЫДУЩЕГО компонента. Кто рисует показ, ждёт по этому флагу. */
  readonly loading: () => boolean;
  /** Положить готовые данные напрямую в `componentDataAtom` — источник наполнения показа,
   *  сохранённый content. */
  readonly setData: (data: unknown) => void;
  /** Данные ТЕКУЩЕГО компонента как они лежат в `componentDataAtom` сейчас — читает `Input` для
   *  точечной правки одного поля (`withValue` от `schema.ts` кладёт правку поверх этого значения). */
  readonly data: () => unknown;
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
  const data = useAtom(componentDataAtom);

  createEffect(
    on(currentComponent, () => {
      componentDataAtom.set(undefined);
      componentEventsAtom.set([]);
    }),
  );

  function recordEvent(event: DispatchedEvent): void {
    componentEventsAtom.set((events) => [...events, event]);
  }

  // `createResourceAtom` (packages/store) несёт последнее известное `data` и в "pending" —
  // читаем его напрямую, без своего буфера: до этой правки в общем пакете `pending` был голым
  // (без `data`), и без локального сглаживания тут `ready`/`info` мигали на каждый клик по дереву.
  const componentInfo = createMemo(() => {
    const state = info();
    return state.status === "error" ? undefined : state.data;
  });

  const ready = createMemo(() => componentInfo() !== undefined);

  const loading = createMemo(() => info().status === "pending");

  function setData(data: unknown): void {
    componentDataAtom.set(data);
  }

  return { ready, loading, setData, data, info: componentInfo, recordEvent };
}
