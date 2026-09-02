// СОСТОЯНИЕ ПОКАЗА — общее между витриной (`pages/_workspace/showcase`, знает КАКОЙ компонент
// сейчас показан) и панелью ввода (`widgets/data-input`, живёт в постоянном `WorkspaceRightbar`,
// вне `Outlet` — своего доступа к параметру маршрута у неё нет). Стор (`@omnifield/probe-web-
// store`), не голый `createSignal` — тем же приёмом и по той же причине, что и `entities/component/
// model/store.ts`: состояние нужно больше чем одному потребителю, второй копии не заводим.

import type { DispatchedEvent } from "@omnifield/probe-web-assembly";
import { createStore, useSelector } from "@omnifield/probe-web-store";

interface PreviewState {
  readonly component: string | undefined;
  /** Какая именно сборка показанного компонента активна — нет роута с ней, нет и значения. */
  readonly assembly: string | undefined;
  /** Выбранная запись заготовки — наполняет ВСЕ показанные варианты текущего компонента разом. */
  readonly fill: Record<string, unknown> | undefined;
  /**
   * Последнее событие, отданное показанным компонентом (`ComponentPreview`'s `dispatch`,
   * PWEB-187 продолжение, постановка user 2026-08-30: «пока сделай просто 1 объект, каждое
   * событие перезаписывает предыдущее, позже сделаем историю»). ОДИН объект — не перечень.
   */
  readonly lastEvent: DispatchedEvent | undefined;
}

export const previewStore = createStore({
  context: { component: undefined, assembly: undefined, fill: undefined, lastEvent: undefined } as PreviewState,
  on: {
    // Смена показанного компонента сбрасывает наполнение и последнее событие: и то, и другое
    // принадлежало прежнему показу, чужому новому не обязаны быть верны.
    shown: (_context, event: { component: string; assembly: string | undefined }): PreviewState => ({
      component: event.component,
      assembly: event.assembly,
      fill: undefined,
      lastEvent: undefined,
    }),
    filled: (context, event: { fill: Record<string, unknown> | undefined }): PreviewState => ({
      ...context,
      fill: event.fill,
    }),
    dispatched: (context, event: { event: DispatchedEvent }): PreviewState => ({
      ...context,
      lastEvent: event.event,
    }),
  },
});

/** Какой компонент сейчас показан — реактивный аксессор. */
export function usePreviewComponent() {
  return useSelector(previewStore, (state) => state.context.component);
}

/** Какая сборка показанного компонента сейчас активна — реактивный аксессор. */
export function usePreviewAssembly() {
  return useSelector(previewStore, (state) => state.context.assembly);
}

/** Чем наполнен текущий показ — реактивный аксессор. */
export function usePreviewFill() {
  return useSelector(previewStore, (state) => state.context.fill);
}

/** Последнее событие, отданное показом, — реактивный аксессор. */
export function usePreviewLastEvent() {
  return useSelector(previewStore, (state) => state.context.lastEvent);
}
